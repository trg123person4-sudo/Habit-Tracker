/* =============================================================================
 * pic.h — 8259 Programmable Interrupt Controller (PIC) Driver
 * =============================================================================
 * Manages Master and Slave 8259 PICs, remapping hardware IRQs from legacy
 * colliding vectors 0x08-0x0F to clean vectors 0x20-0x2F (32-47).
 * ============================================================================= */

#ifndef MYOS_DRIVERS_PIC_H
#define MYOS_DRIVERS_PIC_H

#include "types.h"

/* 8259 PIC I/O Ports */
#define PIC1_COMMAND 0x20
#define PIC1_DATA    0x21
#define PIC2_COMMAND 0xA0
#define PIC2_DATA    0xA1

/* Vector Offsets */
#define PIC1_VECTOR_OFFSET 0x20       /* IRQ 0..7  -> Vectors 32..39 */
#define PIC2_VECTOR_OFFSET 0x28       /* IRQ 8..15 -> Vectors 40..47 */

/* Core PIC API */
void pic_init(void);
void pic_send_eoi(uint8_t irq);
void pic_set_mask(uint8_t irq);
void pic_clear_mask(uint8_t irq);
void pic_disable(void);

#endif /* MYOS_DRIVERS_PIC_H */
