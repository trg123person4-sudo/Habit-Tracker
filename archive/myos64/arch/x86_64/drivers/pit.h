/* =============================================================================
 * pit.h — 8254 Programmable Interval Timer (PIT) Driver
 * =============================================================================
 * Generates periodic hardware timer interrupts on IRQ 0 (vector 32).
 * Drives the system clock, timekeeping, and preemptive multitasking ticks.
 * ============================================================================= */

#ifndef MYOS_DRIVERS_PIT_H
#define MYOS_DRIVERS_PIT_H

#include "types.h"

#define PIT_DEFAULT_HZ 100            /* 100 Hz = 1 tick every 10 milliseconds */

/* Core PIT API */
void pit_init(uint32_t frequency_hz);
uint64_t pit_get_ticks(void);
void pit_sleep_ms(uint64_t ms);

#endif /* MYOS_DRIVERS_PIT_H */
