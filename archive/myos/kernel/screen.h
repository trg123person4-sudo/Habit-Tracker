/* ============================================================
 * screen.h — VGA Text Mode Display Driver
 * ============================================================
 * In text mode, the screen is an 80x25 grid of characters.
 * Each cell is 2 bytes in video memory at 0xB8000:
 *   Byte 0: ASCII character
 *   Byte 1: Color attribute (foreground | background << 4)
 * ============================================================ */

#ifndef SCREEN_H
#define SCREEN_H

/* VGA text mode constants */
#define VIDEO_ADDRESS 0xB8000
#define MAX_ROWS      25
#define MAX_COLS      80

/* Color attributes (foreground on black background) */
#define COLOR_BLACK        0x00
#define COLOR_BLUE         0x01
#define COLOR_GREEN        0x02
#define COLOR_CYAN         0x03
#define COLOR_RED          0x04
#define COLOR_MAGENTA      0x05
#define COLOR_BROWN        0x06
#define COLOR_LIGHT_GRAY   0x07
#define COLOR_DARK_GRAY    0x08
#define COLOR_LIGHT_BLUE   0x09
#define COLOR_LIGHT_GREEN  0x0A
#define COLOR_LIGHT_CYAN   0x0B
#define COLOR_LIGHT_RED    0x0C
#define COLOR_LIGHT_MAGENTA 0x0D
#define COLOR_YELLOW       0x0E
#define COLOR_WHITE        0x0F

/* Screen functions */
void clear_screen(void);
void print(const char *message);
void print_colored(const char *message, unsigned char color);
void print_char(char c);
void print_at(const char *message, int row, int col);
void print_newline(void);
void print_backspace(void);

#endif /* SCREEN_H */
