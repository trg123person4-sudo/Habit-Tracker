/* =============================================================================
 * serial.c — UART 16550 Serial Port Driver Implementation
 * =============================================================================
 * Configures COM1 at 0x3F8 for 115200 baud, 8N1, FIFO enabled.
 * Emits kernel messages to the host console.
 * ============================================================================= */

#include "serial.h"

static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile ("outb %0, %1" : : "a"(val), "Nd"(port));
}

static inline uint8_t inb(uint16_t port) {
    uint8_t ret;
    __asm__ volatile ("inb %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

/* Check if transmit holding register is empty */
static inline int serial_is_transmit_empty(void) {
    return inb(COM1_PORT + 5) & 0x20;
}

/* -----------------------------------------------------------------------------
 * Initialize COM1 UART for 115200 baud, 8N1
 * ----------------------------------------------------------------------------- */
void serial_init(void) {
    outb(COM1_PORT + 1, 0x00);        /* Disable interrupts */
    outb(COM1_PORT + 3, 0x80);        /* Enable DLAB (set baud rate divisor) */
    outb(COM1_PORT + 0, 0x01);        /* Set divisor to 1 (low byte) -> 115200 baud */
    outb(COM1_PORT + 1, 0x00);        /*                  (high byte) */
    outb(COM1_PORT + 3, 0x03);        /* 8 bits, no parity, one stop bit (8N1) */
    outb(COM1_PORT + 2, 0xC7);        /* Enable FIFO, clear them, with 14-byte threshold */
    outb(COM1_PORT + 4, 0x0B);        /* IRQs enabled, RTS/DSR set */
}

/* -----------------------------------------------------------------------------
 * Output single character over serial COM1
 * ----------------------------------------------------------------------------- */
void serial_putc(char c) {
    while (!serial_is_transmit_empty());
    outb(COM1_PORT, c);
}

/* -----------------------------------------------------------------------------
 * Output null-terminated string over serial COM1
 * ----------------------------------------------------------------------------- */
void serial_puts(const char *str) {
    if (!str) return;
    for (size_t i = 0; str[i] != '\0'; i++) {
        if (str[i] == '\n') {
            serial_putc('\r');
        }
        serial_putc(str[i]);
    }
}

/* -----------------------------------------------------------------------------
 * Output 64-bit integer as hexadecimal over serial
 * ----------------------------------------------------------------------------- */
void serial_put_hex(uint64_t val) {
    serial_puts("0x");
    if (val == 0) {
        serial_putc('0');
        return;
    }

    char buf[17];
    buf[16] = '\0';
    int pos = 15;

    while (val > 0 && pos >= 0) {
        uint8_t digit = (uint8_t)(val & 0xF);
        buf[pos--] = (digit < 10) ? ('0' + digit) : ('A' + digit - 10);
        val >>= 4;
    }

    serial_puts(&buf[pos + 1]);
}

/* -----------------------------------------------------------------------------
 * Output 64-bit integer as decimal over serial
 * ----------------------------------------------------------------------------- */
void serial_put_dec(uint64_t val) {
    if (val == 0) {
        serial_putc('0');
        return;
    }

    char buf[21];
    buf[20] = '\0';
    int pos = 19;

    while (val > 0 && pos >= 0) {
        buf[pos--] = '0' + (char)(val % 10);
        val /= 10;
    }

    serial_puts(&buf[pos + 1]);
}
