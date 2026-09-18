/* ============================================================
 * keyboard.h — PS/2 Keyboard Driver (Polling)
 * ============================================================
 * Reads keystrokes by polling the keyboard controller ports.
 * No interrupt setup required — simple and beginner-friendly.
 * ============================================================ */

#ifndef KEYBOARD_H
#define KEYBOARD_H

/* Read one character from keyboard (blocks until key press) */
char keyboard_read_char(void);

/* Check if a key is available (non-blocking) */
int keyboard_has_key(void);

#endif /* KEYBOARD_H */
