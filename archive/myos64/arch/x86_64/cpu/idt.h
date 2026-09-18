/* =============================================================================
 * idt.h — 64-Bit Interrupt Descriptor Table (IDT)
 * =============================================================================
 * In x86_64 Long Mode, IDT entries (Gate Descriptors) are expanded from
 * 8 bytes to 16 bytes to accommodate full 64-bit target virtual addresses and
 * the 3-bit Interrupt Stack Table (IST) selector.
 * ============================================================================= */

#ifndef MYOS_CPU_IDT_H
#define MYOS_CPU_IDT_H

#include "types.h"

#define IDT_ENTRIES 256

/* IDT Gate Attributes */
#define IDT_ATTR_PRESENT      0x80
#define IDT_ATTR_RING0        0x00
#define IDT_ATTR_RING3        0x60
#define IDT_ATTR_INTERRUPT_GATE 0x0E
#define IDT_ATTR_TRAP_GATE      0x0F

/* Common combinations */
#define IDT_GATE_KERNEL_INT   (IDT_ATTR_PRESENT | IDT_ATTR_RING0 | IDT_ATTR_INTERRUPT_GATE) /* 0x8E */
#define IDT_GATE_USER_INT     (IDT_ATTR_PRESENT | IDT_ATTR_RING3 | IDT_ATTR_INTERRUPT_GATE) /* 0xEE */

/* 16-Byte x86_64 IDT Gate Descriptor */
struct idt_entry {
    uint16_t offset_low;      /* Bits 0..15 of target address */
    uint16_t selector;        /* Code segment selector in GDT */
    uint8_t  ist;             /* Bits 0..2 = IST index (0=disabled, 1..7=IST), bits 3..7=0 */
    uint8_t  type_attr;       /* Gate type, DPL, and Present bit */
    uint16_t offset_mid;      /* Bits 16..31 of target address */
    uint32_t offset_high;     /* Bits 32..63 of target address */
    uint32_t reserved;        /* Reserved (must be zero) */
} __attribute__((packed));
typedef struct idt_entry idt_entry_t;

/* IDT Register Pointer */
struct idt_ptr {
    uint16_t limit;
    uint64_t base;
} __attribute__((packed));
typedef struct idt_ptr idt_ptr_t;

/* Core IDT API */
void idt_init(void);
void idt_set_gate(uint8_t num, uint64_t base, uint16_t sel, uint8_t ist, uint8_t flags);

#endif /* MYOS_CPU_IDT_H */
