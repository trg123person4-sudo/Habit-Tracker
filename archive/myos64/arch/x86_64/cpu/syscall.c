/* =============================================================================
 * syscall.c — Fast System Call Configuration & Dispatcher
 * =============================================================================
 * Configures CPU MSRs for hardware SYSCALL / SYSRET instructions and routes
 * user-space system calls to kernel services.
 * ============================================================================= */

#include "syscall.h"
#include "vga.h"
#include "serial.h"
#include "sched.h"
#include "pit.h"

#define MSR_EFER  0xC0000080
#define MSR_STAR  0xC0000081
#define MSR_LSTAR 0xC0000082
#define MSR_FMASK 0xC0000084

extern void syscall_entry(void);

static inline uint64_t rdmsr(uint32_t msr) {
    uint32_t low, high;
    __asm__ volatile ("rdmsr" : "=a"(low), "=d"(high) : "c"(msr));
    return ((uint64_t)high << 32) | low;
}

static inline void wrmsr(uint32_t msr, uint64_t val) {
    uint32_t low = (uint32_t)val;
    uint32_t high = (uint32_t)(val >> 32);
    __asm__ volatile ("wrmsr" : : "a"(low), "d"(high), "c"(msr));
}

/* -----------------------------------------------------------------------------
 * Program x86_64 Model-Specific Registers (MSRs) for SYSCALL / SYSRET
 * ----------------------------------------------------------------------------- */
void syscall_init(void) {
    /* 1. Enable System Call Extensions (SCE) in IA32_EFER (bit 0) */
    uint64_t efer = rdmsr(MSR_EFER);
    wrmsr(MSR_EFER, efer | 1);

    /* 2. Configure Segment Selectors in IA32_STAR:
     *    Bits 47..32: Kernel CS (0x08), Kernel SS (0x10)
     *    Bits 63..48: User CS base (0x10) -> User SS (0x1B), User CS (0x23) */
    uint64_t star = ((uint64_t)0x00100008 << 32);
    wrmsr(MSR_STAR, star);

    /* 3. Set LSTAR to entry point address */
    wrmsr(MSR_LSTAR, (uint64_t)syscall_entry);

    /* 4. Configure RFLAGS mask in FMASK: Disable Interrupts (IF bit 9 = 0x200) */
    wrmsr(MSR_FMASK, 0x200);
}

/* -----------------------------------------------------------------------------
 * System Call Dispatcher (Invoked from syscall_entry.asm)
 * ----------------------------------------------------------------------------- */
uint64_t syscall_dispatch(uint64_t num, uint64_t a1, uint64_t a2, uint64_t a3) {
    (void)a2; (void)a3;

    switch (num) {
        case SYS_PRINT: {
            const char *msg = (const char *)a1;
            if (msg) {
                vga_puts(msg);
                serial_puts(msg);
            }
            return 0;
        }

        case SYS_GETPID: {
            task_t *cur = sched_get_current();
            return cur ? cur->pid : 0;
        }

        case SYS_SLEEP: {
            pit_sleep_ms(a1);
            return 0;
        }

        case SYS_EXIT: {
            task_t *cur = sched_get_current();
            if (cur) {
                cur->state = TASK_STATE_TERMINATED;
            }
            sched_yield();
            return 0;
        }

        default:
            return (uint64_t)-1; /* Invalid system call number */
    }
}
