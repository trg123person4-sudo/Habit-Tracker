/* =============================================================================
 * keyboard.c — Interrupt-Driven PS/2 Keyboard Driver (IRQ 1)
 * =============================================================================
 * Handles hardware interrupts from PS/2 Keyboard on IRQ 1 (vector 33).
 * Translates Scancode Set 1 make/break codes, tracks shift/caps/ctrl modifiers,
 * and maintains a 256-byte circular FIFO ring buffer.
 * ============================================================================= */

#include "keyboard.h"
#include "isr.h"
#include "pic.h"

#define KBD_DATA_PORT   0x60
#define KBD_STATUS_PORT 0x64

static volatile char kbd_buffer[KBD_BUFFER_SIZE];
static volatile size_t kbd_head = 0;
static volatile size_t kbd_tail = 0;

static bool shift_pressed = false;
static bool caps_lock     = false;
static bool ctrl_pressed  = false;
static bool alt_pressed   = false;
static bool extended_mode = false;

static inline uint8_t inb(uint16_t port) {
    uint8_t ret;
    __asm__ volatile ("inb %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

/* -----------------------------------------------------------------------------
 * Scancode Set 1 — US QWERTY Standard Map
 * ----------------------------------------------------------------------------- */
static const char kbd_us_normal[128] = {
    0,   27, '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '\b',
    '\t', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\n',
    0,   'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', '`',
    0,   '\\', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 0,
    '*', 0,   ' ', 0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   '-', 0,   0,   0,   '+', 0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0
};

/* -----------------------------------------------------------------------------
 * Scancode Set 1 — US QWERTY Shifted Map
 * ----------------------------------------------------------------------------- */
static const char kbd_us_shifted[128] = {
    0,   27, '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '\b',
    '\t', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '\n',
    0,   'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"', '~',
    0,   '|', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', 0,
    '*', 0,   ' ', 0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   '-', 0,   0,   0,   '+', 0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0
};

/* -----------------------------------------------------------------------------
 * Enqueue character into circular ring buffer
 * ----------------------------------------------------------------------------- */
static void kbd_enqueue(char c) {
    size_t next_head = (kbd_head + 1) % KBD_BUFFER_SIZE;
    if (next_head != kbd_tail) {
        kbd_buffer[kbd_head] = c;
        kbd_head = next_head;
    }
}

/* -----------------------------------------------------------------------------
 * Hardware IRQ 1 Keyboard Interrupt Callback
 * ----------------------------------------------------------------------------- */
static void keyboard_irq_callback(interrupt_frame_t *frame) {
    (void)frame;
    uint8_t scancode = inb(KBD_DATA_PORT);

    /* Handle 0xE0 prefix for extended keys */
    if (scancode == 0xE0) {
        extended_mode = true;
        return;
    }

    /* Key Release (Break Code: Bit 7 set) */
    if (scancode & 0x80) {
        uint8_t released_key = scancode & 0x7F;
        if (released_key == 0x2A || released_key == 0x36) {
            shift_pressed = false;
        } else if (released_key == 0x1D) {
            ctrl_pressed = false;
        } else if (released_key == 0x38) {
            alt_pressed = false;
        }
        extended_mode = false;
        return;
    }

    /* Key Press (Make Code) */
    if (scancode == 0x2A || scancode == 0x36) {
        shift_pressed = true;
        extended_mode = false;
        return;
    } else if (scancode == 0x1D) {
        ctrl_pressed = true;
        extended_mode = false;
        return;
    } else if (scancode == 0x38) {
        alt_pressed = true;
        extended_mode = false;
        return;
    } else if (scancode == 0x3A) {
        caps_lock = !caps_lock;
        extended_mode = false;
        return;
    }

    /* Translate scancode to ASCII */
    if (scancode < 128) {
        char ch = 0;
        bool use_upper = shift_pressed ^ caps_lock;

        /* Check if letter */
        char base_ch = kbd_us_normal[scancode];
        if (base_ch >= 'a' && base_ch <= 'z') {
            ch = use_upper ? kbd_us_shifted[scancode] : base_ch;
        } else {
            ch = shift_pressed ? kbd_us_shifted[scancode] : base_ch;
        }

        if (ch != 0) {
            kbd_enqueue(ch);
        }
    }

    extended_mode = false;
}

/* -----------------------------------------------------------------------------
 * Initialize Keyboard Subsystem and unmask IRQ 1
 * ----------------------------------------------------------------------------- */
void keyboard_init(void) {
    kbd_head = 0;
    kbd_tail = 0;

    /* Register callback with IRQ 1 */
    register_irq_handler(1, keyboard_irq_callback);

    /* Unmask IRQ 1 on Master PIC */
    pic_clear_mask(1);
}

/* -----------------------------------------------------------------------------
 * Non-blocking query: Check if characters are pending in ring buffer
 * ----------------------------------------------------------------------------- */
bool keyboard_has_char(void) {
    return kbd_head != kbd_tail;
}

/* -----------------------------------------------------------------------------
 * Blocking read: Dequeue next ASCII character (idles CPU until interrupt fires)
 * ----------------------------------------------------------------------------- */
char keyboard_getchar(void) {
    while (!keyboard_has_char()) {
        __asm__ volatile ("hlt");
    }

    char c = kbd_buffer[kbd_tail];
    kbd_tail = (kbd_tail + 1) % KBD_BUFFER_SIZE;
    return c;
}
