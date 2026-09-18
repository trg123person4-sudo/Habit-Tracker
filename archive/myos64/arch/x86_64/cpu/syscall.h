/* =============================================================================
 * syscall.h — Fast Hardware System Calls (SYSCALL / SYSRET)
 * =============================================================================
 * Configures AMD64 fast system call MSRs and defines user-space system call API.
 * ============================================================================= */

#ifndef MYOS_CPU_SYSCALL_H
#define MYOS_CPU_SYSCALL_H

#include "types.h"

/* System Call Identifiers */
#define SYS_PRINT  1
#define SYS_GETPID 2
#define SYS_SLEEP  3
#define SYS_EXIT   4

/* System Call API */
void syscall_init(void);
uint64_t syscall_dispatch(uint64_t num, uint64_t arg1, uint64_t arg2, uint64_t arg3);

/* -----------------------------------------------------------------------------
 * User-space inline assembly invoker for SYSCALL instruction
 * System V calling convention for syscall:
 *   RAX = syscall number
 *   RDI = arg 1
 *   RSI = arg 2
 *   RDX = arg 3
 *   RCX, R11 clobbered by CPU hardware
 * ----------------------------------------------------------------------------- */
static inline uint64_t sys_call(uint64_t num, uint64_t a1, uint64_t a2, uint64_t a3) {
    uint64_t ret;
    register uint64_t r10 __asm__("r10") = a3;
    __asm__ volatile (
        "syscall"
        : "=a"(ret)
        : "a"(num), "D"(a1), "S"(a2), "r"(r10)
        : "rcx", "r11", "memory"
    );
    return ret;
}

#endif /* MYOS_CPU_SYSCALL_H */
