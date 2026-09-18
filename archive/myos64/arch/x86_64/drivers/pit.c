/* =============================================================================
 * pit.c — 8254 Programmable Interval Timer (PIT) Implementation
 * =============================================================================
 * Programs 8254 PIT Channel 0 in Mode 3 (Square Wave Generator).
 * Handles IRQ 0 timer ticks and provides delay primitives.
 * ============================================================================= */

#include "pit.h"
#include "isr.h"
#include "pic.h"

#define PIT_BASE_FREQUENCY 1193182
#define PIT_CHANNEL0_DATA  0x40
#define PIT_COMMAND_PORT   0x43

static volatile uint64_t pit_ticks = 0;
static uint32_t pit_frequency = PIT_DEFAULT_HZ;

static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile ("outb %0, %1" : : "a"(val), "Nd"(port));
}

/* -----------------------------------------------------------------------------
 * PIT IRQ 0 Handler (Invoked at configured frequency)
 * ----------------------------------------------------------------------------- */
static void pit_irq_callback(interrupt_frame_t *frame) {
    (void)frame;
    pit_ticks++;
}

/* -----------------------------------------------------------------------------
 * Initialize PIT to fire IRQ 0 at specified frequency (Hz)
 * ----------------------------------------------------------------------------- */
void pit_init(uint32_t frequency_hz) {
    if (frequency_hz == 0) frequency_hz = PIT_DEFAULT_HZ;
    pit_frequency = frequency_hz;

    uint32_t divisor = PIT_BASE_FREQUENCY / frequency_hz;
    if (divisor > 65535) divisor = 65535;

    /* Command byte 0x36: Channel 0, Access lo/hi byte, Mode 3 (square wave), 16-bit binary */
    outb(PIT_COMMAND_PORT, 0x36);
    outb(PIT_CHANNEL0_DATA, (uint8_t)(divisor & 0xFF));
    outb(PIT_CHANNEL0_DATA, (uint8_t)((divisor >> 8) & 0xFF));

    /* Register callback for IRQ 0 */
    register_irq_handler(0, pit_irq_callback);

    /* Unmask IRQ0 in PIC */
    pic_clear_mask(0);
}

/* -----------------------------------------------------------------------------
 * Return total timer ticks elapsed since system boot
 * ----------------------------------------------------------------------------- */
uint64_t pit_get_ticks(void) {
    return pit_ticks;
}

/* -----------------------------------------------------------------------------
 * Busy-wait sleep based on hardware timer ticks
 * ----------------------------------------------------------------------------- */
void pit_sleep_ms(uint64_t ms) {
    /* At 100 Hz, 1 tick = 10 ms */
    uint64_t ticks_to_wait = (ms * pit_frequency) / 1000;
    if (ticks_to_wait == 0) ticks_to_wait = 1;

    uint64_t target = pit_ticks + ticks_to_wait;
    while (pit_ticks < target) {
        __asm__ volatile ("hlt");
    }
}
