/* =============================================================================
 * keyboard.h — Interrupt-Driven PS/2 Keyboard Driver (IRQ 1)
 * =============================================================================
 * Receives hardware keyboard interrupts via IRQ 1 (vector 33), decodes
 * Scancode Set 1 make/break codes, tracks modifier keys (Shift, Caps, Ctrl, Alt),
 * and buffers characters in a lockless circular ring buffer.
 * ============================================================================= */

#ifndef MYOS_DRIVERS_KEYBOARD_H
#define MYOS_DRIVERS_KEYBOARD_H

#include "types.h"

#define KBD_BUFFER_SIZE 256

/* Core Keyboard API */
void keyboard_init(void);
char keyboard_getchar(void);
bool keyboard_has_char(void);

#endif /* MYOS_DRIVERS_KEYBOARD_H */
