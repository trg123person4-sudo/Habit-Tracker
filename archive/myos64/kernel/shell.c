/* =============================================================================
 * shell.c — Interactive Kernel Shell Implementation
 * =============================================================================
 * Command-line interpreter with line editing, argument parsing, system
 * diagnostics, task management (ps, spawn), and Ring 3 user mode demo.
 * ============================================================================= */

#include "shell.h"
#include "vga.h"
#include "keyboard.h"
#include "serial.h"
#include "pmm.h"
#include "heap.h"
#include "pit.h"
#include "sched.h"
#include "task.h"
#include "syscall.h"

/* -----------------------------------------------------------------------------
 * Freestanding String Utilities
 * ----------------------------------------------------------------------------- */
static int strcmp(const char *s1, const char *s2) {
    while (*s1 && (*s1 == *s2)) {
        s1++;
        s2++;
    }
    return *(const unsigned char *)s1 - *(const unsigned char *)s2;
}

static size_t strlen(const char *s) {
    size_t len = 0;
    while (s[len]) len++;
    return len;
}

static uint64_t parse_dec(const char *s) {
    uint64_t val = 0;
    while (*s >= '0' && *s <= '9') {
        val = val * 10 + (*s - '0');
        s++;
    }
    return val;
}

static uint64_t parse_hex(const char *s) {
    if (s[0] == '0' && (s[1] == 'x' || s[1] == 'X')) s += 2;
    uint64_t val = 0;
    while (*s) {
        char c = *s;
        if (c >= '0' && c <= '9') val = (val << 4) | (c - '0');
        else if (c >= 'a' && c <= 'f') val = (val << 4) | (c - 'a' + 10);
        else if (c >= 'A' && c <= 'F') val = (val << 4) | (c - 'A' + 10);
        else break;
        s++;
    }
    return val;
}

/* -----------------------------------------------------------------------------
 * Print helpers to both VGA text console and Serial COM1
 * ----------------------------------------------------------------------------- */
static void console_puts(const char *str) {
    vga_puts(str);
    serial_puts(str);
}

static void console_puts_colored(const char *str, vga_color_t fg, vga_color_t bg) {
    vga_puts_colored(str, fg, bg);
    serial_puts(str);
}

static void console_put_dec(uint64_t val) {
    vga_put_dec(val);
    serial_put_dec(val);
}

static void console_put_hex(uint64_t val) {
    vga_put_hex(val);
    serial_put_hex(val);
}

/* -----------------------------------------------------------------------------
 * Background Worker Functions for Multitasking Demo
 * ----------------------------------------------------------------------------- */
static void worker_a_fn(void) {
    for (int i = 1; i <= 5; i++) {
        pit_sleep_ms(1500);
        serial_puts("[WorkerA PID ");
        serial_put_dec(sched_get_current()->pid);
        serial_puts("] Progress step ");
        serial_put_dec(i);
        serial_puts("/5 executing concurrently\n");
    }
    serial_puts("[WorkerA] Completed all iterations. Exiting.\n");
    task_exit();
}

static void worker_b_fn(void) {
    for (int i = 1; i <= 5; i++) {
        pit_sleep_ms(2000);
        serial_puts("[WorkerB PID ");
        serial_put_dec(sched_get_current()->pid);
        serial_puts("] Progress step ");
        serial_put_dec(i);
        serial_puts("/5 executing concurrently\n");
    }
    serial_puts("[WorkerB] Completed all iterations. Exiting.\n");
    task_exit();
}

/* -----------------------------------------------------------------------------
 * Ring 3 User Space Task Entry Point
 * ----------------------------------------------------------------------------- */
static void user_mode_task_fn(void) {
    /* User mode code executing at privilege level 3 (DPL = 3) */
    sys_call(SYS_PRINT, (uint64_t)"\n>>> [Ring 3 User Mode] Hello! Executing unprivileged instructions.\n", 0, 0);
    
    uint64_t my_pid = sys_call(SYS_GETPID, 0, 0, 0);
    sys_call(SYS_PRINT, (uint64_t)">>> [Ring 3 User Mode] Invoking SYS_GETPID... My PID is: ", 0, 0);
    
    char pid_str[3];
    pid_str[0] = '0' + (char)(my_pid % 10);
    pid_str[1] = '\n';
    pid_str[2] = '\0';
    sys_call(SYS_PRINT, (uint64_t)pid_str, 0, 0);

    sys_call(SYS_PRINT, (uint64_t)">>> [Ring 3 User Mode] Calling SYS_EXIT to terminate user thread.\n\n", 0, 0);
    sys_call(SYS_EXIT, 0, 0, 0);

    /* Should not be reached */
    while (1);
}

/* -----------------------------------------------------------------------------
 * Built-in Shell Command Handlers
 * ----------------------------------------------------------------------------- */
static void cmd_help(int argc, char **argv) {
    (void)argc; (void)argv;
    console_puts_colored("\n  Available MyOS64 Commands:\n", VGA_COLOR_YELLOW, VGA_COLOR_BLACK);
    console_puts("  -----------------------------------------------------------------\n");
    console_puts("  help             - Display this command manual\n");
    console_puts("  clear            - Clear the VGA text console\n");
    console_puts("  about            - Display OS architecture & build specifications\n");
    console_puts("  meminfo          - Display physical & heap memory telemetry\n");
    console_puts("  alloc <bytes>    - Dynamically allocate memory block from kernel heap\n");
    console_puts("  free <hex_ptr>   - Deallocate memory block and coalesce heap\n");
    console_puts("  echo <text>      - Echo arguments to console and serial port\n");
    console_puts("  time             - Display uptime and PIT timer ticks\n");
    console_puts("  ps               - List all active processes and scheduler threads\n");
    console_puts("  spawn            - Spawn concurrent background worker tasks\n");
    console_puts("  ring3            - Execute a Ring 3 user mode task with SYSCALL test\n");
    console_puts("  panic            - Test fatal division-by-zero CPU exception (#DE)\n");
    console_puts("  reboot           - Trigger hardware system reboot\n\n");
}

static void cmd_clear(int argc, char **argv) {
    (void)argc; (void)argv;
    vga_clear();
}

static void cmd_about(int argc, char **argv) {
    (void)argc; (void)argv;
    console_puts("\n");
    console_puts_colored("  ===============================================================\n", VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);
    console_puts_colored("                     MyOS64 Operating System                     \n", VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    console_puts_colored("  ===============================================================\n", VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);
    console_puts("  Architecture: x86_64 (AMD64) Long Mode with 4-Level Paging (PML4)\n");
    console_puts("  Bootloader  : Dual Multiboot1 / Multiboot2 Compliant\n");
    console_puts("  CPU Tables  : 64-Bit GDT with TSS (IST1 emergency stack) & IDT (256 gates)\n");
    console_puts("  Interrupts  : Remapped 8259 PIC (vectors 32-47) + 100 Hz 8254 PIT\n");
    console_puts("  Memory      : Bitmap PMM + 4-Level Paging VMM + Dynamic Heap (kmalloc)\n");
    console_puts("  Drivers     : VGA Text (0xB8000), PS/2 Keyboard (IRQ 1), COM1 (115200 8N1)\n");
    console_puts("  Multitasking: Preemptive Round-Robin Scheduler + Ring 3 SYSCALL/SYSRET\n\n");
}

static void cmd_meminfo(int argc, char **argv) {
    (void)argc; (void)argv;
    size_t total_mb = pmm_get_total_memory() / (1024 * 1024);
    size_t used_mb  = pmm_get_used_memory() / (1024 * 1024);
    size_t free_mb  = pmm_get_free_memory() / (1024 * 1024);

    size_t heap_alloc_kb = kheap_get_allocated_bytes() / 1024;
    size_t heap_free_kb  = kheap_get_free_bytes() / 1024;

    console_puts_colored("\n--- Physical Memory (PMM) ---\n", VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);
    console_puts("  Total RAM : "); console_put_dec(total_mb); console_puts(" MiB\n");
    console_puts("  Used RAM  : "); console_put_dec(used_mb);  console_puts(" MiB\n");
    console_puts("  Free RAM  : "); console_put_dec(free_mb);  console_puts(" MiB\n");

    console_puts_colored("--- Kernel Heap (VMM) ---\n", VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);
    console_puts("  Allocated : "); console_put_dec(heap_alloc_kb); console_puts(" KiB\n");
    console_puts("  Available : "); console_put_dec(heap_free_kb);  console_puts(" KiB\n\n");
}

static void cmd_alloc(int argc, char **argv) {
    if (argc < 2) {
        console_puts_colored("Usage: alloc <bytes>\n", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
        return;
    }
    uint64_t bytes = parse_dec(argv[1]);
    if (bytes == 0) {
        console_puts_colored("Error: Size must be greater than zero.\n", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
        return;
    }

    void *ptr = kmalloc((size_t)bytes);
    if (!ptr) {
        console_puts_colored("Error: Kernel heap out of memory.\n", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
        return;
    }

    console_puts_colored("Allocated ", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    console_put_dec(bytes);
    console_puts(" bytes at virtual address: ");
    console_put_hex((uint64_t)ptr);
    console_puts("\n");
}

static void cmd_free(int argc, char **argv) {
    if (argc < 2) {
        console_puts_colored("Usage: free <hex_address>\n", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
        return;
    }
    uint64_t addr = parse_hex(argv[1]);
    if (addr == 0) {
        console_puts_colored("Error: Invalid address.\n", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
        return;
    }

    kfree((void *)addr);
    console_puts_colored("Deallocated block at: ", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    console_put_hex(addr);
    console_puts(" (Adjacent free blocks coalesced)\n");
}

static void cmd_echo(int argc, char **argv) {
    console_puts("\n");
    for (int i = 1; i < argc; i++) {
        console_puts(argv[i]);
        if (i < argc - 1) console_puts(" ");
    }
    console_puts("\n\n");
}

static void cmd_time(int argc, char **argv) {
    (void)argc; (void)argv;
    uint64_t ticks = pit_get_ticks();
    uint64_t sec = ticks / PIT_DEFAULT_HZ;

    console_puts("\n  System Uptime : ");
    console_put_dec(sec);
    console_puts(" seconds\n  PIT IRQ Ticks : ");
    console_put_dec(ticks);
    console_puts("\n\n");
}

static void cmd_ps(int argc, char **argv) {
    (void)argc; (void)argv;
    console_puts_colored("\n  PID   STATE       NAME\n", VGA_COLOR_YELLOW, VGA_COLOR_BLACK);
    console_puts("  -----------------------------------------\n");

    task_t *head = sched_get_task_list();
    if (!head) return;

    task_t *curr = head;
    do {
        console_puts("  ");
        console_put_dec(curr->pid);
        console_puts("     ");

        switch (curr->state) {
            case TASK_STATE_RUNNING:    console_puts_colored("RUNNING     ", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK); break;
            case TASK_STATE_READY:      console_puts_colored("READY       ", VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);  break;
            case TASK_STATE_SLEEPING:   console_puts_colored("SLEEPING    ", VGA_COLOR_LIGHT_GREY, VGA_COLOR_BLACK);  break;
            case TASK_STATE_TERMINATED: console_puts_colored("TERMINATED  ", VGA_COLOR_DARK_GREY, VGA_COLOR_BLACK);  break;
        }

        console_puts(curr->name);
        console_puts("\n");

        curr = curr->next;
    } while (curr && curr != head);

    console_puts("\n");
}

static void cmd_spawn(int argc, char **argv) {
    (void)argc; (void)argv;
    console_puts_colored("Spawning concurrent kernel background worker tasks...\n", VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);

    task_t *tA = task_create("WorkerA", worker_a_fn, false);
    task_t *tB = task_create("WorkerB", worker_b_fn, false);

    if (tA && tB) {
        sched_add_task(tA);
        sched_add_task(tB);
        console_puts_colored("[ OK ] Spawned WorkerA (PID ", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
        console_put_dec(tA->pid);
        console_puts_colored(") and WorkerB (PID ", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
        console_put_dec(tB->pid);
        console_puts_colored(")\n", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
        console_puts("Workers are now time-slicing via timer preemption. Monitor output over COM1 serial!\n");
    } else {
        console_puts_colored("Failed to spawn tasks.\n", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
    }
}

static void cmd_ring3(int argc, char **argv) {
    (void)argc; (void)argv;
    console_puts_colored("Creating Ring 3 user mode task and adding to scheduler...\n", VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);

    task_t *u_task = task_create("user_demo", user_mode_task_fn, true);
    if (u_task) {
        sched_add_task(u_task);
        console_puts_colored("[ OK ] Ring 3 User Task created (PID ", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
        console_put_dec(u_task->pid);
        console_puts_colored("). Scheduler will switch into user mode on next quantum!\n", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    } else {
        console_puts_colored("Failed to create user mode task.\n", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
    }
}

static void cmd_panic(int argc, char **argv) {
    (void)argc; (void)argv;
    console_puts_colored("Triggering intentional Division-by-Zero CPU Exception (#DE)...\n", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
    volatile int x = 42;
    volatile int y = 0;
    volatile int z = x / y;
    (void)z;
}

static void cmd_reboot(int argc, char **argv) {
    (void)argc; (void)argv;
    console_puts_colored("Rebooting system...\n", VGA_COLOR_YELLOW, VGA_COLOR_BLACK);
    __asm__ volatile ("outb %0, %1" : : "a"((uint8_t)0xFE), "Nd"((uint16_t)0x64));
}

/* -----------------------------------------------------------------------------
 * Command Dispatch Table
 * ----------------------------------------------------------------------------- */
typedef struct {
    const char *name;
    void (*func)(int argc, char **argv);
} shell_cmd_t;

static shell_cmd_t commands[] = {
    { "help",    cmd_help },
    { "clear",   cmd_clear },
    { "about",   cmd_about },
    { "meminfo", cmd_meminfo },
    { "alloc",   cmd_alloc },
    { "free",    cmd_free },
    { "echo",    cmd_echo },
    { "time",    cmd_time },
    { "ps",      cmd_ps },
    { "spawn",   cmd_spawn },
    { "ring3",   cmd_ring3 },
    { "panic",   cmd_panic },
    { "reboot",  cmd_reboot },
    { NULL,      NULL }
};

/* -----------------------------------------------------------------------------
 * Tokenize and execute command line
 * ----------------------------------------------------------------------------- */
static void execute_line(char *line) {
    char *argv[SHELL_MAX_ARGS];
    int argc = 0;

    char *p = line;
    while (*p && argc < SHELL_MAX_ARGS) {
        while (*p == ' ' || *p == '\t') p++;
        if (*p == '\0') break;

        argv[argc++] = p;
        while (*p && *p != ' ' && *p != '\t') p++;

        if (*p) {
            *p = '\0';
            p++;
        }
    }

    if (argc == 0) return;

    for (int i = 0; commands[i].name != NULL; i++) {
        if (strcmp(argv[0], commands[i].name) == 0) {
            commands[i].func(argc, argv);
            return;
        }
    }

    console_puts_colored("Unknown command: '", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
    console_puts(argv[0]);
    console_puts_colored("'. Type 'help' for available commands.\n", VGA_COLOR_LIGHT_RED, VGA_COLOR_BLACK);
}

/* -----------------------------------------------------------------------------
 * Print shell prompt
 * ----------------------------------------------------------------------------- */
static void print_prompt(void) {
    console_puts_colored("myos64", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    console_puts_colored("> ", VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK);
}

/* -----------------------------------------------------------------------------
 * Main Shell Interactive Loop
 * ----------------------------------------------------------------------------- */
void shell_run(void) {
    char line_buf[SHELL_MAX_LINE];
    size_t line_len = 0;

    console_puts("\n");
    print_prompt();

    while (1) {
        char c = keyboard_getchar();

        if (c == '\n') {
            vga_putc('\n');
            serial_putc('\n');

            line_buf[line_len] = '\0';
            execute_line(line_buf);

            line_len = 0;
            print_prompt();

        } else if (c == '\b') {
            if (line_len > 0) {
                line_len--;
                vga_putc('\b');
                vga_putc(' ');
                vga_putc('\b');
                serial_puts("\b \b");
            }

        } else if (c >= ' ' && c <= '~') {
            if (line_len < SHELL_MAX_LINE - 1) {
                line_buf[line_len++] = c;
                vga_putc(c);
                serial_putc(c);
            }
        }
    }
}
