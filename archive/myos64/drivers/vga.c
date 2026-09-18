/* =============================================================================
 * vga.c — VGA Text Mode Driver Implementation
 * =============================================================================
 * Handles direct memory-mapped buffer operations at 0xB8000, hardware cursor
 * updates via CRTC ports 0x3D4/0x3D5, vertical line scrolling, and formatted output.
 * ============================================================================= */

#include "vga.h"

static size_t vga_row = 0;
static size_t vga_col = 0;
static uint8_t vga_current_color = 0;

/* -----------------------------------------------------------------------------
 * Low-level x86 I/O Port Output
 * ----------------------------------------------------------------------------- */
static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile ("outb %0, %1" : : "a"(val), "Nd"(port));
}

/* -----------------------------------------------------------------------------
 * Pack ASCII character and color attribute into 16-bit VGA cell
 * ----------------------------------------------------------------------------- */
static inline uint16_t vga_entry(unsigned char uc, uint8_t color) {
    return (uint16_t)uc | ((uint16_t)color << 8);
}

/* -----------------------------------------------------------------------------
 * Pack foreground and background colors into 8-bit attribute byte
 * ----------------------------------------------------------------------------- */
static inline uint8_t vga_entry_color(vga_color_t fg, vga_color_t bg) {
    return fg | (bg << 4);
}

/* -----------------------------------------------------------------------------
 * Update CRT controller hardware cursor position
 * ----------------------------------------------------------------------------- */
void vga_set_cursor(size_t x, size_t y) {
    uint16_t pos = (uint16_t)(y * VGA_WIDTH + x);
    outb(0x3D4, 0x0F);
    outb(0x3D5, (uint8_t)(pos & 0xFF));
    outb(0x3D4, 0x0E);
    outb(0x3D5, (uint8_t)((pos >> 8) & 0xFF));
}

/* -----------------------------------------------------------------------------
 * Scroll screen up by one row when cursor exceeds vertical bounds
 * ----------------------------------------------------------------------------- */
static void vga_scroll(void) {
    volatile uint16_t *buffer = VGA_MEMORY;

    /* Shift all lines up by one */
    for (size_t y = 1; y < VGA_HEIGHT; y++) {
        for (size_t x = 0; x < VGA_WIDTH; x++) {
            buffer[(y - 1) * VGA_WIDTH + x] = buffer[y * VGA_WIDTH + x];
        }
    }

    /* Blank out the bottom line */
    uint16_t blank = vga_entry(' ', vga_current_color);
    for (size_t x = 0; x < VGA_WIDTH; x++) {
        buffer[(VGA_HEIGHT - 1) * VGA_WIDTH + x] = blank;
    }

    vga_row = VGA_HEIGHT - 1;
}

/* -----------------------------------------------------------------------------
 * Initialize VGA driver and clear screen
 * ----------------------------------------------------------------------------- */
void vga_init(void) {
    vga_row = 0;
    vga_col = 0;
    vga_current_color = vga_entry_color(VGA_COLOR_LIGHT_GREY, VGA_COLOR_BLACK);
    vga_clear();
}

/* -----------------------------------------------------------------------------
 * Set active text color attribute
 * ----------------------------------------------------------------------------- */
void vga_set_color(vga_color_t fg, vga_color_t bg) {
    vga_current_color = vga_entry_color(fg, bg);
}

/* -----------------------------------------------------------------------------
 * Clear entire 80x25 screen and reset cursor to (0, 0)
 * ----------------------------------------------------------------------------- */
void vga_clear(void) {
    volatile uint16_t *buffer = VGA_MEMORY;
    uint16_t blank = vga_entry(' ', vga_current_color);

    for (size_t i = 0; i < VGA_WIDTH * VGA_HEIGHT; i++) {
        buffer[i] = blank;
    }

    vga_row = 0;
    vga_col = 0;
    vga_set_cursor(0, 0);
}

/* -----------------------------------------------------------------------------
 * Output single character with control code handling
 * ----------------------------------------------------------------------------- */
void vga_putc(char c) {
    volatile uint16_t *buffer = VGA_MEMORY;

    if (c == '\n') {
        vga_col = 0;
        vga_row++;
    } else if (c == '\r') {
        vga_col = 0;
    } else if (c == '\t') {
        /* Align to next 4-column tab stop */
        vga_col = (vga_col + 4) & ~3;
    } else {
        const size_t index = vga_row * VGA_WIDTH + vga_col;
        buffer[index] = vga_entry((unsigned char)c, vga_current_color);
        vga_col++;
    }

    /* Wrap to next row */
    if (vga_col >= VGA_WIDTH) {
        vga_col = 0;
        vga_row++;
    }

    /* Scroll if bottom reached */
    if (vga_row >= VGA_HEIGHT) {
        vga_scroll();
    }

    vga_set_cursor(vga_col, vga_row);
}

/* -----------------------------------------------------------------------------
 * Output null-terminated string
 * ----------------------------------------------------------------------------- */
void vga_puts(const char *str) {
    if (!str) return;
    for (size_t i = 0; str[i] != '\0'; i++) {
        vga_putc(str[i]);
    }
}

/* -----------------------------------------------------------------------------
 * Output colored null-terminated string, restoring prior color afterwards
 * ----------------------------------------------------------------------------- */
void vga_puts_colored(const char *str, vga_color_t fg, vga_color_t bg) {
    uint8_t old_color = vga_current_color;
    vga_set_color(fg, bg);
    vga_puts(str);
    vga_current_color = old_color;
}

/* -----------------------------------------------------------------------------
 * Output 64-bit unsigned integer as hexadecimal (0x...)
 * ----------------------------------------------------------------------------- */
void vga_put_hex(uint64_t val) {
    vga_puts("0x");
    if (val == 0) {
        vga_putc('0');
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

    vga_puts(&buf[pos + 1]);
}

/* -----------------------------------------------------------------------------
 * Output 64-bit unsigned integer as decimal
 * ----------------------------------------------------------------------------- */
void vga_put_dec(uint64_t val) {
    if (val == 0) {
        vga_putc('0');
        return;
    }

    char buf[21];
    buf[20] = '\0';
    int pos = 19;

    while (val > 0 && pos >= 0) {
        buf[pos--] = '0' + (char)(val % 10);
        val /= 10;
    }

    vga_puts(&buf[pos + 1]);
}
