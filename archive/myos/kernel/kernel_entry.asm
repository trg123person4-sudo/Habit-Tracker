; ============================================================
; Kernel Entry Point
; ============================================================
; This is where the bootloader jumps to after switching
; to 32-bit protected mode. It simply calls our C kernel.
; ============================================================

[BITS 32]
[EXTERN kernel_main]            ; Defined in kernel.c

section .text
global _start

_start:
    call kernel_main            ; Call our C kernel
    jmp $                       ; Hang if kernel_main ever returns
