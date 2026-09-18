/* =============================================================================
 * link.ld — 64-Bit Kernel Linker Script
 * =============================================================================
 * Target Architecture: x86_64 (ELF64)
 * Load Physical Base:  1 MiB (0x100000)
 *
 * Exports _kernel_start and _kernel_end symbols so the memory management
 * subsystem (PMM) knows the exact physical boundaries of the kernel binary.
 * ============================================================================= */

ENTRY(_start)
OUTPUT_FORMAT("elf64-x86-64")

SECTIONS {
    /* Conventional load address above BIOS and VGA MMIO memory */
    . = 1M;

    _kernel_start = .;

    /* Multiboot headers must be first in the final ELF binary */
    .boot : ALIGN(4K) {
        KEEP(*(.multiboot))
    }

    /* Executable kernel code */
    .text : ALIGN(4K) {
        *(.text .text.*)
    }

    /* Read-only data (constants, string literals, GDT descriptors) */
    .rodata : ALIGN(4K) {
        *(.rodata .rodata.*)
    }

    /* Initialized mutable data */
    .data : ALIGN(4K) {
        *(.data .data.*)
    }

    /* Uninitialized data (BSS: page tables, kernel stack) */
    .bss : ALIGN(4K) {
        *(COMMON)
        *(.bss .bss.*)
    }

    _kernel_end = ALIGN(4K);

    /DISCARD/ : {
        *(.comment)
        *(.eh_frame)
        *(.note.*)
    }
}
