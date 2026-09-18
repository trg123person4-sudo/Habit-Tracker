; =============================================================================
; interrupts.asm — 64-Bit Interrupt Service Routine (ISR) Stubs
; =============================================================================
; Provides individual entry points for all 32 x86 CPU exceptions and 16 hardware
; IRQs. Supports preemptive context switching by reloading RSP with the frame
; pointer returned from isr_handler.
; =============================================================================

[bits 64]
section .text

extern isr_handler

; -----------------------------------------------------------------------------
; Macro: Exception without hardware error code
; -----------------------------------------------------------------------------
%macro ISR_NOERRCODE 1
global isr%1
isr%1:
    push qword 0              ; Push dummy error code
    push qword %1             ; Push interrupt vector number
    jmp isr_common_stub
%endmacro

; -----------------------------------------------------------------------------
; Macro: Exception with hardware error code
; -----------------------------------------------------------------------------
%macro ISR_ERRCODE 1
global isr%1
isr%1:
    push qword %1             ; Push interrupt vector number
    jmp isr_common_stub
%endmacro

; -----------------------------------------------------------------------------
; Macro: Hardware IRQ (remapped to vectors 32..47)
; -----------------------------------------------------------------------------
%macro IRQ 2
global irq%1
irq%1:
    push qword 0              ; Push dummy error code
    push qword %2             ; Push interrupt vector number (32 + %1)
    jmp isr_common_stub
%endmacro

; -----------------------------------------------------------------------------
; CPU Exceptions 0-31
; -----------------------------------------------------------------------------
ISR_NOERRCODE 0               ; #DE: Divide-by-Zero
ISR_NOERRCODE 1               ; #DB: Debug
ISR_NOERRCODE 2               ; NMI: Non-Maskable Interrupt
ISR_NOERRCODE 3               ; #BP: Breakpoint
ISR_NOERRCODE 4               ; #OF: Overflow
ISR_NOERRCODE 5               ; #BR: Bound Range Exceeded
ISR_NOERRCODE 6               ; #UD: Invalid Opcode
ISR_NOERRCODE 7               ; #NM: Device Not Available
ISR_ERRCODE   8               ; #DF: Double Fault
ISR_NOERRCODE 9               ; Coprocessor Segment Overrun
ISR_ERRCODE   10              ; #TS: Invalid TSS
ISR_ERRCODE   11              ; #NP: Segment Not Present
ISR_ERRCODE   12              ; #SS: Stack-Segment Fault
ISR_ERRCODE   13              ; #GP: General Protection Fault
ISR_ERRCODE   14              ; #PF: Page Fault
ISR_NOERRCODE 15              ; Reserved
ISR_NOERRCODE 16              ; #MF: x87 Floating-Point Exception
ISR_ERRCODE   17              ; #AC: Alignment Check
ISR_NOERRCODE 18              ; #MC: Machine Check
ISR_NOERRCODE 19              ; #XM: SIMD Floating-Point Exception
ISR_NOERRCODE 20              ; #VE: Virtualization Exception
ISR_ERRCODE   21              ; #CP: Control Protection Exception
ISR_NOERRCODE 22              ; Reserved
ISR_NOERRCODE 23              ; Reserved
ISR_NOERRCODE 24              ; Reserved
ISR_NOERRCODE 25              ; Reserved
ISR_NOERRCODE 26              ; Reserved
ISR_NOERRCODE 27              ; Reserved
ISR_NOERRCODE 28              ; Hypervisor Injection Exception
ISR_ERRCODE   29              ; VMM Communication Exception
ISR_ERRCODE   30              ; Security Exception
ISR_NOERRCODE 31              ; Reserved

; -----------------------------------------------------------------------------
; Hardware IRQs 0-15 (Mapped to vectors 32-47)
; -----------------------------------------------------------------------------
IRQ 0,  32                    ; IRQ 0: Programmable Interval Timer (PIT)
IRQ 1,  33                    ; IRQ 1: PS/2 Keyboard
IRQ 2,  34                    ; IRQ 2: Cascade (PIC2)
IRQ 3,  35                    ; IRQ 3: COM2
IRQ 4,  36                    ; IRQ 4: COM1
IRQ 5,  37                    ; IRQ 5: LPT2
IRQ 6,  38                    ; IRQ 6: Floppy Disk
IRQ 7,  39                    ; IRQ 7: LPT1 / Spurious
IRQ 8,  40                    ; IRQ 8: Real Time Clock (RTC)
IRQ 9,  41                    ; IRQ 9: ACPI / Free
IRQ 10, 42                    ; IRQ 10: Free
IRQ 11, 43                    ; IRQ 11: Free
IRQ 12, 44                    ; IRQ 12: PS/2 Mouse
IRQ 13, 45                    ; IRQ 13: FPU / Coprocessor
IRQ 14, 46                    ; IRQ 14: Primary ATA Hard Disk
IRQ 15, 47                    ; IRQ 15: Secondary ATA Hard Disk

; -----------------------------------------------------------------------------
; Common ISR Dispatch Stub (With Preemptive Context Switching Support)
; -----------------------------------------------------------------------------
isr_common_stub:
    ; Save all 15 general-purpose registers
    push rax
    push rbx
    push rcx
    push rdx
    push rsi
    push rdi
    push rbp
    push r8
    push r9
    push r10
    push r11
    push r12
    push r13
    push r14
    push r15

    ; Pass pointer to current stack frame in RDI
    mov rdi, rsp
    cld

    ; Call C dispatcher: interrupt_frame_t *isr_handler(interrupt_frame_t *frame)
    call isr_handler

    ; Context Switch: RAX holds the active or newly scheduled task's stack frame
    mov rsp, rax

    ; Restore 15 general-purpose registers from the selected task's frame
    pop r15
    pop r14
    pop r13
    pop r12
    pop r11
    pop r10
    pop r9
    pop r8
    pop rbp
    pop rdi
    pop rsi
    pop rdx
    pop rcx
    pop rbx
    pop rax

    ; Clean up pushed error code and interrupt number
    add rsp, 16

    ; Atomic return to task (restores RIP, CS, RFLAGS, RSP, SS)
    iretq
