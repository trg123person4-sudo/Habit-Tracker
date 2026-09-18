/* =============================================================================
 * serial.h — UART 16550 Serial Port Driver (COM1 at 0x3F8)
 * =============================================================================
 * Provides early kernel debugging output streamed directly to host terminal
 * or log files via QEMU's -serial stdio interface.
 * ============================================================================= */

#ifndef MYOS_DRIVERS_SERIAL_H
#define MYOS_DRIVERS_SERIAL_H

#include "types.h"

#define COM1_PORT 0x3F8

/* Core Serial API */
void serial_init(void);
void serial_putc(char c);
void serial_puts(const char *str);
void serial_put_hex(uint64_t val);
void serial_put_dec(uint64_t val);

#endif /* MYOS_DRIVERS_SERIAL_H */
