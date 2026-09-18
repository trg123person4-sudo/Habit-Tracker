/* ============================================================
 * ports.h — Low-level x86 I/O port access
 * ============================================================
 * The CPU communicates with hardware (keyboard, screen, disk)
 * through numbered I/O ports using the IN and OUT instructions.
 * ============================================================ */

#ifndef PORTS_H
#define PORTS_H

/* Read a byte from an I/O port */
static inline unsigned char port_byte_in(unsigned short port) {
    unsigned char result;
    __asm__("in %%dx, %%al" : "=a"(result) : "d"(port));
    return result;
}

/* Write a byte to an I/O port */
static inline void port_byte_out(unsigned short port, unsigned char data) {
    __asm__("out %%al, %%dx" : : "a"(data), "d"(port));
}

#endif /* PORTS_H */
