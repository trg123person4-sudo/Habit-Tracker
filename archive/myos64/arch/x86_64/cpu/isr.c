/* =============================================================================
 * isr.c — Exception Handling & Hardware IRQ Dispatcher
 * =============================================================================
 * Dispatches CPU exceptions (0-31) and hardware IRQs (32-47).
 * Hooks timer ticks to the process scheduler for preemptive context switching.
 * ============================================================================= */

#include "isr.h"
#include "vga.h"
#include "pic.h"
#include "sched.h"

/* 16 Hardware IRQ Handler Callbacks */
static irq_handler_t irq_routines[16] = {0};

/* Standard x86_64 CPU Exception Mnemonics */
static const char *exception_messages[32] = {
    "Division By Zero (#DE)",
    "Debug (#DB)",
    "Non-Maskable Interrupt (NMI)",
    "Breakpoint (#BP)",
    "Overflow (#OF)",
    "Bound Range Exceeded (#BR)",
    "Invalid Opcode (#UD)",
    "Device Not Available (#NM)",
    "Double Fault (#DF)",
    "Coprocessor Segment Overrun",
    "Invalid TSS (#TS)",
    "Segment Not Present (#NP)",
    "Stack-Segment Fault (#SS)",
    "General Protection Fault (#GP)",
    "Page Fault (#PF)",
    "Reserved (15)",
    "x87 Floating-Point Exception (#MF)",
    "Alignment Check (#AC)",
    "Machine Check (#MC)",
    "SIMD Floating-Point Exception (#XM)",
    "Virtualization Exception (#VE)",
    "Control Protection Exception (#CP)",
    "Reserved (22)",
    "Reserved (23)",
    "Reserved (24)",
    "Reserved (25)",
    "Reserved (26)",
    "Reserved (27)",
    "Hypervisor Injection Exception",
    "VMM Communication Exception",
    "Security Exception",
    "Reserved (31)"
};

/* -----------------------------------------------------------------------------
 * Register a driver callback for a hardware IRQ line (0-15)
 * ----------------------------------------------------------------------------- */
void register_irq_handler(uint8_t irq, irq_handler_t handler) {
    if (irq < 16) {
        irq_routines[irq] = handler;
    }
}

/* -----------------------------------------------------------------------------
 * Print register diagnostics upon CPU Exception
 * ----------------------------------------------------------------------------- */
static void dump_exception_frame(interrupt_frame_t *frame) {
    vga_set_color(VGA_COLOR_WHITE, VGA_COLOR_RED);
    vga_puts("\n================================================================================\n");
    vga_puts("                     FATAL CPU EXCEPTION OCCURRED                               \n");
    vga_puts("================================================================================\n");
    vga_set_color(VGA_COLOR_LIGHT_GREY, VGA_COLOR_BLACK);

    vga_puts("Exception : ");
    if (frame->int_no < 32) {
        vga_puts_colored(exception_messages[frame->int_no], VGA_COLOR_YELLOW, VGA_COLOR_BLACK);
    } else {
        vga_put_dec(frame->int_no);
    }
    vga_puts("  Vector: ");
    vga_put_dec(frame->int_no);
    vga_puts("  Error Code: ");
    vga_put_hex(frame->error_code);
    vga_puts("\n");

    /* If Page Fault (#PF, vector 14), read CR2 register */
    if (frame->int_no == 14) {
        uint64_t cr2_val;
        __asm__ volatile ("mov %%cr2, %0" : "=r"(cr2_val));
        vga_puts_colored("Faulting Linear Address (CR2): ", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
        vga_put_hex(cr2_val);
        vga_puts("\n");
    }

    vga_puts_colored("--- Architectural Registers ---\n", VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);
    vga_puts("RIP: "); vga_put_hex(frame->rip); vga_puts("  CS : "); vga_put_hex(frame->cs);
    vga_puts("  RFLAGS: "); vga_put_hex(frame->rflags); vga_puts("\n");
    vga_puts("RSP: "); vga_put_hex(frame->rsp); vga_puts("  SS : "); vga_put_hex(frame->ss);
    vga_puts("  RBP   : "); vga_put_hex(frame->rbp); vga_puts("\n");

    vga_puts("RAX: "); vga_put_hex(frame->rax); vga_puts("  RBX: "); vga_put_hex(frame->rbx);
    vga_puts("  RCX   : "); vga_put_hex(frame->rcx); vga_puts("\n");
    vga_puts("RDX: "); vga_put_hex(frame->rdx); vga_puts("  RSI: "); vga_put_hex(frame->rsi);
    vga_puts("  RDI   : "); vga_put_hex(frame->rdi); vga_puts("\n");

    vga_puts("R8 : "); vga_put_hex(frame->r8);  vga_puts("  R9 : "); vga_put_hex(frame->r9);
    vga_puts("  R10   : "); vga_put_hex(frame->r10); vga_puts("\n");
    vga_puts("R11: "); vga_put_hex(frame->r11); vga_puts("  R12: "); vga_put_hex(frame->r12);
    vga_puts("  R13   : "); vga_put_hex(frame->r13); vga_puts("\n");
    vga_puts("R14: "); vga_put_hex(frame->r14); vga_puts("  R15: "); vga_put_hex(frame->r15);
    vga_puts("\n");

    vga_puts_colored("System halted permanently.\n", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
}

/* -----------------------------------------------------------------------------
 * Central Interrupt Service Routine Handler (Invoked from interrupts.asm)
 * Returns pointer to the stack frame to restore (enabling context switches).
 * ----------------------------------------------------------------------------- */
interrupt_frame_t *isr_handler(interrupt_frame_t *frame) {
    /* Case 1: CPU Exception (Vectors 0-31) */
    if (frame->int_no < 32) {
        dump_exception_frame(frame);
        while (1) {
            __asm__ volatile ("cli; hlt");
        }
    }

    /* Case 2: Hardware IRQ (Vectors 32-47) */
    if (frame->int_no >= 32 && frame->int_no < 48) {
        uint8_t irq = (uint8_t)(frame->int_no - 32);

        /* Invoke registered IRQ driver callback */
        if (irq_routines[irq] != 0) {
            irq_routines[irq](frame);
        }

        /* Signal End of Interrupt to 8259 PIC */
        pic_send_eoi(irq);

        /* On Timer Tick (IRQ 0), invoke scheduler for preemptive multitasking */
        if (irq == 0) {
            return sched_tick(frame);
        }
    }

    return frame;
}
