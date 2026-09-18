/* =============================================================================
 * isr.h — Interrupt Service Routines & CPU Context Definitions
 * =============================================================================
 * Standardizes CPU register capture across software exceptions (ISRs 0-31)
 * and hardware interrupts (IRQs 32-47) with context switching support.
 * ============================================================================= */

#ifndef MYOS_CPU_ISR_H
#define MYOS_CPU_ISR_H

#include "types.h"

/* Complete 64-bit CPU execution frame captured during interrupt dispatch */
typedef struct {
    /* General Purpose Registers saved by common assembly stub (reverse push order) */
    uint64_t r15;
    uint64_t r14;
    uint64_t r13;
    uint64_t r12;
    uint64_t r11;
    uint64_t r10;
    uint64_t r9;
    uint64_t r8;
    uint64_t rbp;
    uint64_t rdi;
    uint64_t rsi;
    uint64_t rdx;
    uint64_t rcx;
    uint64_t rbx;
    uint64_t rax;

    /* Pushed by specific ISR stub */
    uint64_t int_no;
    uint64_t error_code;

    /* Pushed automatically by x86_64 CPU hardware upon interrupt trigger */
    uint64_t rip;
    uint64_t cs;
    uint64_t rflags;
    uint64_t rsp;
    uint64_t ss;
} interrupt_frame_t;

/* IRQ Callback Function Pointer */
typedef void (*irq_handler_t)(interrupt_frame_t *frame);

/* Core ISR / IRQ API */
void isr_install_handlers(void);
void register_irq_handler(uint8_t irq, irq_handler_t handler);
interrupt_frame_t *isr_handler(interrupt_frame_t *frame);

#endif /* MYOS_CPU_ISR_H */
