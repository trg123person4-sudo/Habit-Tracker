/* =============================================================================
 * gdt.h — 64-Bit Global Descriptor Table (GDT) & Task State Segment (TSS)
 * =============================================================================
 * In x86_64 Long Mode, segmentation is disabled for address translation, but
 * segment selectors are still mandatory for privilege levels (Ring 0 vs Ring 3),
 * 64-bit code attributes, and Task State Segment (TSS) stack switching.
 * ============================================================================= */

#ifndef MYOS_CPU_GDT_H
#define MYOS_CPU_GDT_H

#include "types.h"

/* GDT Segment Selector Offsets */
#define GDT_KERNEL_CODE_SEL  0x08
#define GDT_KERNEL_DATA_SEL  0x10
#define GDT_USER_DATA_SEL    0x18
#define GDT_USER_CODE_SEL    0x20
#define GDT_TSS_SEL          0x28

/* 64-Bit Task State Segment (TSS) Structure */
struct tss_entry {
    uint32_t reserved0;
    uint64_t rsp0;            /* Ring 0 kernel stack pointer */
    uint64_t rsp1;
    uint64_t rsp2;
    uint64_t reserved1;
    uint64_t ist1;            /* Emergency Interrupt Stack 1 (Double Fault #DF) */
    uint64_t ist2;
    uint64_t ist3;
    uint64_t ist4;
    uint64_t ist5;
    uint64_t ist6;
    uint64_t ist7;
    uint64_t reserved2;
    uint16_t reserved3;
    uint16_t iomap_base;
} __attribute__((packed));
typedef struct tss_entry tss_entry_t;

/* GDT Descriptor Table Pointer */
struct gdt_ptr {
    uint16_t limit;
    uint64_t base;
} __attribute__((packed));
typedef struct gdt_ptr gdt_ptr_t;

/* Core GDT API */
void gdt_init(void);
void gdt_set_kernel_stack(uint64_t stack_top);

#endif /* MYOS_CPU_GDT_H */
