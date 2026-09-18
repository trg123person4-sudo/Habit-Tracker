/* =============================================================================
 * pic.c — 8259 PIC Remapping & Control Implementation
 * =============================================================================
 * Remaps PIC interrupts away from vectors 0-31 to vectors 32-47, preventing
 * conflict with CPU exceptions.
 * ============================================================================= */

#include "pic.h"

#define PIC_EOI      0x20
#define ICW1_INIT    0x11
#define ICW4_8086    0x01

/* Low-level port I/O helpers */
static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile ("outb %0, %1" : : "a"(val), "Nd"(port));
}

static inline uint8_t inb(uint16_t port) {
    uint8_t ret;
    __asm__ volatile ("inb %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

/* Small delay for older hardware bus synchronization */
static inline void io_wait(void) {
    __asm__ volatile ("outb %%al, $0x80" : : "a"(0));
}

/* -----------------------------------------------------------------------------
 * Remap 8259 Master & Slave PICs
 * ----------------------------------------------------------------------------- */
void pic_init(void) {
    /* ICW1: Start initialization sequence in cascade mode */
    outb(PIC1_COMMAND, ICW1_INIT);
    io_wait();
    outb(PIC2_COMMAND, ICW1_INIT);
    io_wait();

    /* ICW2: Vector offset mapping */
    outb(PIC1_DATA, PIC1_VECTOR_OFFSET); /* Master -> 0x20 (32) */
    io_wait();
    outb(PIC2_DATA, PIC2_VECTOR_OFFSET); /* Slave  -> 0x28 (40) */
    io_wait();

    /* ICW3: Cascade wiring configuration */
    outb(PIC1_DATA, 0x04);               /* Master has slave on IRQ2 (0000 0100b) */
    io_wait();
    outb(PIC2_DATA, 0x02);               /* Slave connects to IRQ2 (0000 0010b) */
    io_wait();

    /* ICW4: Set 8086/88 architecture mode */
    outb(PIC1_DATA, ICW4_8086);
    io_wait();
    outb(PIC2_DATA, ICW4_8086);
    io_wait();

    /* Initial Mask: Unmask IRQ0 (Timer, bit 0 = 0), mask all other lines */
    outb(PIC1_DATA, 0xFE);
    outb(PIC2_DATA, 0xFF);
}

/* -----------------------------------------------------------------------------
 * Send End of Interrupt (EOI) signal to PIC controllers
 * ----------------------------------------------------------------------------- */
void pic_send_eoi(uint8_t irq) {
    if (irq >= 8) {
        /* If interrupt came from Slave PIC, notify slave first */
        outb(PIC2_COMMAND, PIC_EOI);
    }
    /* Always notify Master PIC */
    outb(PIC1_COMMAND, PIC_EOI);
}

/* -----------------------------------------------------------------------------
 * Mask an individual IRQ line (disable interrupt)
 * ----------------------------------------------------------------------------- */
void pic_set_mask(uint8_t irq) {
    uint16_t port;
    uint8_t value;

    if (irq < 8) {
        port = PIC1_DATA;
    } else {
        port = PIC2_DATA;
        irq -= 8;
    }
    value = inb(port) | (1 << irq);
    outb(port, value);
}

/* -----------------------------------------------------------------------------
 * Unmask an individual IRQ line (enable interrupt)
 * ----------------------------------------------------------------------------- */
void pic_clear_mask(uint8_t irq) {
    uint16_t port;
    uint8_t value;

    if (irq < 8) {
        port = PIC1_DATA;
    } else {
        port = PIC2_DATA;
        irq -= 8;
    }
    value = inb(port) & ~(1 << irq);
    outb(port, value);
}

/* -----------------------------------------------------------------------------
 * Disable both PICs completely (used when transitioning to APIC in future)
 * ----------------------------------------------------------------------------- */
void pic_disable(void) {
    outb(PIC1_DATA, 0xFF);
    outb(PIC2_DATA, 0xFF);
}
