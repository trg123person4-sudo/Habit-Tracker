/* =============================================================================
 * gdt.c — 64-Bit Global Descriptor Table (GDT) & TSS Implementation
 * =============================================================================
 * Constructs a production-grade 64-bit GDT containing:
 *   - Null Descriptor
 *   - 64-bit Kernel Code (DPL 0) & Kernel Data (DPL 0)
 *   - 64-bit User Data (DPL 3) & User Code (DPL 3)
 *   - 16-byte 64-bit Task State Segment (TSS) Descriptor
 * Configures an emergency stack (IST1) for the Double Fault exception handler.
 * ============================================================================= */

#include "gdt.h"

#define GDT_ENTRY_COUNT 7

/* 64-bit GDT entries (Standard descriptors are 8 bytes; TSS is 16 bytes = 2 slots) */
static uint64_t gdt_entries[GDT_ENTRY_COUNT];
static gdt_ptr_t gdt_pointer;
static tss_entry_t tss;

/* 4 KiB dedicated emergency stack for Double Fault (#DF) handler (IST1) */
static uint8_t double_fault_stack[4096] __attribute__((aligned(16)));

/* -----------------------------------------------------------------------------
 * Assembly helper to reload code/data segments and load TSS
 * ----------------------------------------------------------------------------- */
static void gdt_flush(uint64_t gdt_ptr_addr) {
    __asm__ volatile (
        "lgdt (%0)\n\t"
        /* Reload data segment registers */
        "mov $0x10, %%ax\n\t"
        "mov %%ax, %%ds\n\t"
        "mov %%ax, %%es\n\t"
        "mov %%ax, %%ss\n\t"
        "mov %%ax, %%fs\n\t"
        "mov %%ax, %%gs\n\t"
        /* Far return to reload CS with 0x08 */
        "pushq $0x08\n\t"
        "lea 1f(%%rip), %%rax\n\t"
        "pushq %%rax\n\t"
        "lretq\n\t"
        "1:\n\t"
        /* Load Task Register with TSS selector (0x28) */
        "mov $0x28, %%ax\n\t"
        "ltr %%ax\n\t"
        :
        : "r"(gdt_ptr_addr)
        : "rax", "memory"
    );
}

/* -----------------------------------------------------------------------------
 * Initialize GDT, TSS, and IST1 emergency stack
 * ----------------------------------------------------------------------------- */
void gdt_init(void) {
    /* Clear TSS */
    uint8_t *tss_ptr = (uint8_t *)&tss;
    for (size_t i = 0; i < sizeof(tss_entry_t); i++) {
        tss_ptr[i] = 0;
    }

    /* Assign IST1 emergency stack for Double Faults */
    tss.ist1 = (uint64_t)&double_fault_stack[4096];
    tss.iomap_base = sizeof(tss_entry_t);

    /* 0x00: Null Descriptor */
    gdt_entries[0] = 0x0000000000000000;

    /* 0x08: Kernel Code Segment (64-bit, Ring 0, Executable, Readable) */
    /* Access = 0x9A, Flags = 0x2 (L=1, D=0) */
    gdt_entries[1] = 0x00209A0000000000;

    /* 0x10: Kernel Data Segment (64-bit, Ring 0, Writable) */
    /* Access = 0x92, Flags = 0x0 */
    gdt_entries[2] = 0x0000920000000000;

    /* 0x18: User Data Segment (64-bit, Ring 3, Writable) */
    /* Access = 0xF2, Flags = 0x0 */
    gdt_entries[3] = 0x0000F20000000000;

    /* 0x20: User Code Segment (64-bit, Ring 3, Executable, Readable) */
    /* Access = 0xFA, Flags = 0x2 (L=1, D=0) */
    gdt_entries[4] = 0x0020FA0000000000;

    /* 0x28: Task State Segment (16-byte system descriptor in x86_64) */
    uint64_t tss_base = (uint64_t)&tss;
    uint32_t tss_limit = sizeof(tss_entry_t) - 1;

    /* Low 8 bytes of TSS descriptor */
    gdt_entries[5] = (tss_limit & 0xFFFF) |
                     ((tss_base & 0xFFFFFF) << 16) |
                     (0x89ULL << 40) |                /* Present, DPL 0, Type 9: Available 64-bit TSS */
                     (((uint64_t)(tss_limit >> 16) & 0x0F) << 48) |
                     (((tss_base >> 24) & 0xFF) << 56);

    /* High 8 bytes of TSS descriptor (contains upper 32 bits of base) */
    gdt_entries[6] = (tss_base >> 32) & 0xFFFFFFFF;

    /* Prepare GDT pointer */
    gdt_pointer.limit = (uint16_t)(sizeof(gdt_entries) - 1);
    gdt_pointer.base = (uint64_t)&gdt_entries[0];

    /* Flush and reload CPU descriptor caches */
    gdt_flush((uint64_t)&gdt_pointer);
}

/* -----------------------------------------------------------------------------
 * Update kernel stack pointer in TSS (used when switching user-mode tasks)
 * ----------------------------------------------------------------------------- */
void gdt_set_kernel_stack(uint64_t stack_top) {
    tss.rsp0 = stack_top;
}
