/* ============================================================
 * kernel.c — MyOS Kernel
 * ============================================================
 * The main kernel! This is where your OS logic lives.
 *
 * Currently implements:
 *   - A welcome screen with colored ASCII art
 *   - A simple command-line shell
 *   - Built-in commands: help, clear, about, reboot
 * ============================================================ */

#include "screen.h"
#include "keyboard.h"

/* ----------------------------------------------------------
 * Utility: compare two strings (returns 1 if equal)
 * ---------------------------------------------------------- */
static int str_equals(const char *a, const char *b) {
    while (*a && *b) {
        if (*a != *b) return 0;
        a++;
        b++;
    }
    return *a == *b;
}

/* ----------------------------------------------------------
 * Utility: string length
 * ---------------------------------------------------------- */
static int str_len(const char *s) {
    int len = 0;
    while (s[len]) len++;
    return len;
}

/* ----------------------------------------------------------
 * Print the shell prompt
 * ---------------------------------------------------------- */
static void print_prompt(void) {
    print_colored("myos", COLOR_LIGHT_GREEN);
    print_colored("> ", COLOR_LIGHT_CYAN);
}

/* ----------------------------------------------------------
 * Handle a command entered by the user
 * ---------------------------------------------------------- */
static void handle_command(const char *cmd) {
    if (str_equals(cmd, "help")) {
        print("\n");
        print_colored("  Available Commands:\n", COLOR_YELLOW);
        print("  -----------------------------------------------\n");
        print("  help    - Show this help message\n");
        print("  clear   - Clear the screen\n");
        print("  about   - About MyOS\n");
        print("  echo    - (try: type anything after 'echo ')\n");
        print("  reboot  - Reboot the system\n");
        print("\n");

    } else if (str_equals(cmd, "clear")) {
        clear_screen();
        return;

    } else if (str_equals(cmd, "about")) {
        print("\n");
        print_colored("  ================================\n", COLOR_LIGHT_CYAN);
        print_colored("       MyOS v0.1\n", COLOR_YELLOW);
        print_colored("  ================================\n", COLOR_LIGHT_CYAN);
        print("  A minimal operating system\n");
        print("  built from scratch in C and\n");
        print("  x86 Assembly.\n");
        print("\n");
        print("  Architecture: x86 (32-bit)\n");
        print("  Display:      VGA Text Mode\n");
        print("  Keyboard:     PS/2 (polling)\n");
        print("\n");

    } else if (str_equals(cmd, "reboot")) {
        print("\nRebooting...\n");
        /* Triple fault: load a zero-length IDT and trigger an interrupt */
        __asm__ volatile(
            "lidt (%%eax)"
            :
            : "a"(0)
        );

    } else if (cmd[0] == 'e' && cmd[1] == 'c' && cmd[2] == 'h' &&
               cmd[3] == 'o' && cmd[4] == ' ') {
        /* Simple echo command */
        print("\n");
        print_colored(&cmd[5], COLOR_LIGHT_CYAN);
        print("\n");

    } else if (str_len(cmd) > 0) {
        print("\n");
        print_colored("  Unknown command: ", COLOR_LIGHT_RED);
        print(cmd);
        print("\n  Type 'help' for available commands.\n");

    } else {
        print_newline();
    }
}

/* ----------------------------------------------------------
 * kernel_main — Entry point called from kernel_entry.asm
 * ---------------------------------------------------------- */
void kernel_main(void) {
    clear_screen();

    /* Print welcome banner */
    print_colored("  ==========================================\n", COLOR_LIGHT_CYAN);
    print_colored("       _  _        ___  ___                 \n", COLOR_YELLOW);
    print_colored("      | \\/ |      / _ \\/ __|               \n", COLOR_YELLOW);
    print_colored("      | |\\/| |_  _| | | \\__ \\              \n", COLOR_YELLOW);
    print_colored("      |_|  |_| || |_| |___/                \n", COLOR_YELLOW);
    print_colored("             \\_, |\\___/                     \n", COLOR_YELLOW);
    print_colored("             |__/                           \n", COLOR_YELLOW);
    print_colored("  ==========================================\n", COLOR_LIGHT_CYAN);
    print("\n");
    print_colored("  Welcome to MyOS!\n", COLOR_WHITE);
    print("  Your operating system is up and running.\n");
    print("  Type ");
    print_colored("help", COLOR_YELLOW);
    print(" for a list of commands.\n\n");

    /* Command buffer */
    char input[256];
    int input_len = 0;

    print_prompt();

    /* ======================================================
     * Main shell loop — the heart of the OS
     * Read keystrokes, build commands, execute them
     * ====================================================== */
    while (1) {
        char c = keyboard_read_char();

        if (c == '\n') {
            /* Enter pressed — execute the command */
            input[input_len] = '\0';
            handle_command(input);
            input_len = 0;
            print_prompt();

        } else if (c == '\b') {
            /* Backspace — delete last character */
            if (input_len > 0) {
                input_len--;
                print_backspace();
            }

        } else if (input_len < 255) {
            /* Regular character — add to buffer and display */
            input[input_len++] = c;
            print_char(c);
        }
    }
}
