/* =============================================================================
 * kmain.c — 64-bit Kernel Main Entry Point
 * =============================================================================
 * Phase 5 Integration:
 *   1. Displays boot diagnostic headers across VGA console and Serial COM1.
 *   2. Initializes CPU descriptor tables (GDT64, TSS with IST1, IDT64).
 *   3. Remaps 8259 PIC and configures 8254 PIT (100 Hz).
 *   4. Initializes Memory Managers (PMM Bitmap, VMM 4-Level Paging, Dynamic Heap).
 *   5. Initializes Drivers (PS/2 Keyboard IRQ 1, UART 16550 COM1).
 *   6. Initializes Fast System Calls (MSRs for SYSCALL / SYSRET).
 *   7. Initializes Preemptive Round-Robin Scheduler.
 *   8. Enables CPU Hardware Interrupts (STI).
 *   9. Launches Interactive Kernel Shell.
 * ============================================================================= */

#include "types.h"
#include "vga.h"
#include "serial.h"
#include "gdt.h"
#include "idt.h"
#include "isr.h"
#include "pic.h"
#include "pit.h"
#include "pmm.h"
#include "vmm.h"
#include "heap.h"
#include "keyboard.h"
#include "syscall.h"
#include "sched.h"
#include "shell.h"

/* -----------------------------------------------------------------------------
 * Kernel 64-bit Entry Point
 * ----------------------------------------------------------------------------- */
void kmain(uint64_t multiboot_magic, uint64_t multiboot_info_addr) {
    /* Step 1: Initialize Display & Serial Ports */
    vga_init();
    serial_init();

    serial_puts("\n[KERNEL] Booting MyOS64 in x86_64 Long Mode...\n");

    /* Header Banner */
    vga_puts_colored("================================================================================", VGA_COLOR_CYAN, VGA_COLOR_BLACK);
    vga_puts_colored("         MyOS64 -- Phase 5: Preemptive Multitasking, Ring 3 & System Calls      \n", VGA_COLOR_WHITE, VGA_COLOR_BLACK);
    vga_puts_colored("================================================================================\n", VGA_COLOR_CYAN, VGA_COLOR_BLACK);

    /* Step 2: CPU Hardware Tables */
    gdt_init();
    idt_init();
    pic_init();
    pit_init(PIT_DEFAULT_HZ);
    vga_puts_colored("[ OK ] ", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    vga_puts("CPU Tables: GDT64, TSS (IST1), IDT64 (256 gates), PIC & PIT 100 Hz\n");
    serial_puts("[KERNEL] CPU Tables & Interrupts initialized.\n");

    /* Step 3: Memory Subsystems */
    pmm_init(multiboot_magic, multiboot_info_addr);
    vmm_init();
    kheap_init(KHEAP_DEFAULT_VIRT_BASE, KHEAP_INITIAL_SIZE);

    size_t total_mb = pmm_get_total_memory() / (1024 * 1024);
    size_t free_mb  = pmm_get_free_memory() / (1024 * 1024);

    vga_puts_colored("[ OK ] ", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    vga_puts("Memory: PMM (");
    vga_put_dec(free_mb);
    vga_puts("/");
    vga_put_dec(total_mb);
    vga_puts(" MiB free) | VMM (4-Level Paging) | Heap (1 MiB dynamic pool)\n");
    serial_puts("[KERNEL] Memory management subsystems active.\n");

    /* Step 4: Input Subsystems */
    keyboard_init();
    vga_puts_colored("[ OK ] ", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    vga_puts("Drivers: PS/2 Keyboard (IRQ 1 ring buffer) & COM1 Serial (115200 8N1)\n");
    serial_puts("[KERNEL] Keyboard and Serial drivers active.\n");

    /* Step 5: Fast System Calls & Preemptive Scheduler */
    syscall_init();
    sched_init();
    vga_puts_colored("[ OK ] ", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    vga_puts("Multitasking: Preemptive Round-Robin Scheduler & SYSCALL/SYSRET MSRs\n");
    serial_puts("[KERNEL] Scheduler & System Calls initialized.\n");

    /* Step 6: Enable Hardware Interrupts (STI) */
    __asm__ volatile ("sti");
    vga_puts_colored("[ OK ] ", VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK);
    vga_puts_colored("Hardware Interrupts ENABLED (EFLAGS.IF = 1)\n", VGA_COLOR_YELLOW, VGA_COLOR_BLACK);
    serial_puts("[KERNEL] Hardware interrupts enabled.\n");

    vga_puts_colored("--------------------------------------------------------------------------------\n", VGA_COLOR_DARK_GREY, VGA_COLOR_BLACK);
    vga_puts_colored("Type 'help' for commands, 'ps' for process tree, or 'spawn'/'ring3' for demos.\n", VGA_COLOR_WHITE, VGA_COLOR_BLACK);

    /* Step 7: Launch Interactive Shell */
    shell_run();

    /* Unreachable safeguard */
    while (1) {
        __asm__ volatile ("hlt");
    }
}
