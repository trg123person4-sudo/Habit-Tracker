/* ============================================================
 * keyboard.c — PS/2 Keyboard Driver (Polling-based)
 * ============================================================
 * The PS/2 keyboard controller uses two I/O ports:
 *   0x60 — Data port (read scancodes)
 *   0x64 — Status port (bit 0 = data available)
 *
 * When a key is pressed, the controller sends a "make" code.
 * When released, it sends a "break" code (make code | 0x80).
 * We only care about make codes (key presses).
 * ============================================================ */

#include "keyboard.h"
#include "ports.h"

#define KEYBOARD_DATA_PORT   0x60
#define KEYBOARD_STATUS_PORT 0x64

/* ----------------------------------------------------------
 * US QWERTY scancode set 1 → ASCII lookup table
 * Index = scancode, Value = ASCII character (0 = unmapped)
 * ---------------------------------------------------------- */
static const char scancode_to_ascii[] = {
    /* 0x00 */ 0,    0,    '1',  '2',  '3',  '4',  '5',  '6',
    /* 0x08 */ '7',  '8',  '9',  '0',  '-',  '=',  '\b', '\t',
    /* 0x10 */ 'q',  'w',  'e',  'r',  't',  'y',  'u',  'i',
    /* 0x18 */ 'o',  'p',  '[',  ']',  '\n', 0,    'a',  's',
    /* 0x20 */ 'd',  'f',  'g',  'h',  'j',  'k',  'l',  ';',
    /* 0x28 */ '\'', '`',  0,    '\\', 'z',  'x',  'c',  'v',
    /* 0x30 */ 'b',  'n',  'm',  ',',  '.',  '/',  0,    '*',
    /* 0x38 */ 0,    ' '
};

#define SCANCODE_TABLE_SIZE (sizeof(scancode_to_ascii) / sizeof(scancode_to_ascii[0]))

/* ----------------------------------------------------------
 * Check if the keyboard has data ready to read
 * ---------------------------------------------------------- */
int keyboard_has_key(void) {
    return port_byte_in(KEYBOARD_STATUS_PORT) & 0x01;
}

/* ----------------------------------------------------------
 * Read one character from keyboard (blocks until key press)
 * ---------------------------------------------------------- */
char keyboard_read_char(void) {
    while (1) {
        /* Wait until a key event is available */
        while (!keyboard_has_key());

        unsigned char scancode = port_byte_in(KEYBOARD_DATA_PORT);

        /* Ignore key releases (break codes have bit 7 set) */
        if (scancode & 0x80) {
            continue;
        }

        /* Convert scancode to ASCII */
        if (scancode < SCANCODE_TABLE_SIZE && scancode_to_ascii[scancode] != 0) {
            return scancode_to_ascii[scancode];
        }

        /* Unknown/unmapped key — keep waiting */
    }
}
