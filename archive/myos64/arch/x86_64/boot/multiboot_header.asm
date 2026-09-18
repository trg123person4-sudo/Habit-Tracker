; =============================================================================
; multiboot_header.asm — Dual Multiboot1 and Multiboot2 Compliant Headers
; =============================================================================
; Bootloaders (QEMU -kernel, GRUB2, iPXE) scan the beginning of the kernel
; binary (first 32 KiB) for magic numbers.
;
; We provide:
;   1. Multiboot 1 header: 4-byte aligned, universally supported by QEMU -kernel.
;   2. Multiboot 2 header: 8-byte aligned, the modern standard used by GRUB2.
; =============================================================================

section .multiboot
align 8

; -----------------------------------------------------------------------------
; Multiboot 1 Specification Header
; -----------------------------------------------------------------------------
MB1_MAGIC    equ 0x1BADB002
MB1_FLAGS    equ 0x00000003           ; ALIGN modules on 4K boundaries + provide MEMORY map
MB1_CHECKSUM equ -(MB1_MAGIC + MB1_FLAGS)

multiboot1_header:
    dd MB1_MAGIC
    dd MB1_FLAGS
    dd MB1_CHECKSUM

align 8
; -----------------------------------------------------------------------------
; Multiboot 2 Specification Header
; -----------------------------------------------------------------------------
MB2_MAGIC        equ 0xE85250D6
MB2_ARCH         equ 0                ; 0 = 32-bit (i386) protected mode entry
MB2_HEADER_LEN   equ multiboot2_header_end - multiboot2_header_start
MB2_CHECKSUM     equ 0x100000000 - (MB2_MAGIC + MB2_ARCH + MB2_HEADER_LEN)

multiboot2_header_start:
    dd MB2_MAGIC
    dd MB2_ARCH
    dd MB2_HEADER_LEN
    dd MB2_CHECKSUM

    ; End tag (Type 0, Flags 0, Size 8)
    align 8
    dw 0                              ; Type: end
    dw 0                              ; Flags: none
    dd 8                              ; Size: 8 bytes
multiboot2_header_end:
