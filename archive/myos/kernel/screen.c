/* ============================================================
 * screen.c — VGA Text Mode Display Driver
 * ============================================================
 * Writes directly to video memory at 0xB8000 and controls
 * the hardware cursor via VGA I/O ports 0x3D4/0x3D5.
 * ============================================================ */

#include "screen.h"
#include "ports.h"

/* Current cursor position */
static int cursor_row = 0;
static int cursor_col = 0;

/* ----------------------------------------------------------
 * Update the hardware cursor (blinking underscore on screen)
 * ---------------------------------------------------------- */
static void set_cursor(int row, int col) {
    int offset = row * MAX_COLS + col;
    /* VGA cursor position is set via two I/O port writes */
    port_byte_out(0x3D4, 14);                         /* High byte register */
    port_byte_out(0x3D5, (unsigned char)(offset >> 8));
    port_byte_out(0x3D4, 15);                         /* Low byte register */
    port_byte_out(0x3D5, (unsigned char)(offset & 0xFF));
}

/* ----------------------------------------------------------
 * Scroll the entire screen up by one row
 * ---------------------------------------------------------- */
static void scroll_screen(void) {
    unsigned char *video = (unsigned char *)VIDEO_ADDRESS;

    /* Move every row up by one */
    for (int i = 1; i < MAX_ROWS; i++) {
        for (int j = 0; j < MAX_COLS * 2; j++) {
            video[(i - 1) * MAX_COLS * 2 + j] = video[i * MAX_COLS * 2 + j];
        }
    }

    /* Clear the last row */
    for (int j = 0; j < MAX_COLS; j++) {
        video[(MAX_ROWS - 1) * MAX_COLS * 2 + j * 2]     = ' ';
        video[(MAX_ROWS - 1) * MAX_COLS * 2 + j * 2 + 1] = COLOR_WHITE;
    }
}

/* ----------------------------------------------------------
 * Clear the entire screen and reset cursor to top-left
 * ---------------------------------------------------------- */
void clear_screen(void) {
    unsigned char *video = (unsigned char *)VIDEO_ADDRESS;
    for (int i = 0; i < MAX_ROWS * MAX_COLS; i++) {
        video[i * 2]     = ' ';
        video[i * 2 + 1] = COLOR_WHITE;
    }
    cursor_row = 0;
    cursor_col = 0;
    set_cursor(0, 0);
}

/* ----------------------------------------------------------
 * Print a single character at the current cursor position
 * ---------------------------------------------------------- */
void print_char(char c) {
    unsigned char *video = (unsigned char *)VIDEO_ADDRESS;

    if (c == '\n') {
        cursor_col = 0;
        cursor_row++;
    } else if (c == '\r') {
        cursor_col = 0;
    } else {
        int offset = (cursor_row * MAX_COLS + cursor_col) * 2;
        video[offset]     = c;
        video[offset + 1] = COLOR_WHITE;
        cursor_col++;
    }

    /* Wrap to next line if needed */
    if (cursor_col >= MAX_COLS) {
        cursor_col = 0;
        cursor_row++;
    }

    /* Scroll if we've gone past the bottom */
    if (cursor_row >= MAX_ROWS) {
        scroll_screen();
        cursor_row = MAX_ROWS - 1;
    }

    set_cursor(cursor_row, cursor_col);
}

/* ----------------------------------------------------------
 * Print a null-terminated string in default color (white)
 * ---------------------------------------------------------- */
void print(const char *message) {
    for (int i = 0; message[i] != '\0'; i++) {
        print_char(message[i]);
    }
}

/* ----------------------------------------------------------
 * Print a null-terminated string in a specific color
 * ---------------------------------------------------------- */
void print_colored(const char *message, unsigned char color) {
    unsigned char *video = (unsigned char *)VIDEO_ADDRESS;
    for (int i = 0; message[i] != '\0'; i++) {
        if (message[i] == '\n') {
            cursor_col = 0;
            cursor_row++;
        } else {
            int offset = (cursor_row * MAX_COLS + cursor_col) * 2;
            video[offset]     = message[i];
            video[offset + 1] = color;
            cursor_col++;
        }

        if (cursor_col >= MAX_COLS) {
            cursor_col = 0;
            cursor_row++;
        }
        if (cursor_row >= MAX_ROWS) {
            scroll_screen();
            cursor_row = MAX_ROWS - 1;
        }
    }
    set_cursor(cursor_row, cursor_col);
}

/* ----------------------------------------------------------
 * Print a string at a specific row and column
 * ---------------------------------------------------------- */
void print_at(const char *message, int row, int col) {
    cursor_row = row;
    cursor_col = col;
    print(message);
}

/* ----------------------------------------------------------
 * Print a newline
 * ---------------------------------------------------------- */
void print_newline(void) {
    print_char('\n');
}

/* ----------------------------------------------------------
 * Handle backspace: move cursor back and clear character
 * ---------------------------------------------------------- */
void print_backspace(void) {
    if (cursor_col > 0) {
        cursor_col--;
    } else if (cursor_row > 0) {
        cursor_row--;
        cursor_col = MAX_COLS - 1;
    } else {
        return; /* Already at top-left, nothing to do */
    }

    unsigned char *video = (unsigned char *)VIDEO_ADDRESS;
    int offset = (cursor_row * MAX_COLS + cursor_col) * 2;
    video[offset]     = ' ';
    video[offset + 1] = COLOR_WHITE;
    set_cursor(cursor_row, cursor_col);
}
