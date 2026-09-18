/* ============================================================
 * linker.ld — Kernel Linker Script
 * ============================================================
 * Tells the linker how to arrange the kernel in memory.
 * The kernel is loaded at 0x1000 by our bootloader.
 * ============================================================ */

ENTRY(_start)

SECTIONS {
    /* Kernel starts at this address in memory */
    . = 0x1000;

    /* Code section */
    .text : {
        *(.text)
    }

    /* Read-only data (string literals, constants) */
    .rodata : {
        *(.rodata)
    }

    /* Initialized data */
    .data : {
        *(.data)
    }

    /* Uninitialized data (zeroed) */
    .bss : {
        *(.bss)
    }
}
