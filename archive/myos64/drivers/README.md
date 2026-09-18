# MyOS64 — Complete 64-Bit Operating System

Welcome to **MyOS64**, a lightweight, modular, production-grade 64-bit operating system kernel built from scratch in freestanding C and x86_64 assembly.

---

## 🏛️ Comprehensive Architecture Overview

MyOS64 implements the full low-level operating system stack across 5 incremental phases:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   Ring 3 User Space & System Calls                       │
│    Unprivileged User Tasks | SYSCALL / SYSRET Fast Hardware Dispatch     │
│    SYS_PRINT (1) | SYS_GETPID (2) | SYS_SLEEP (3) | SYS_EXIT (4)        │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────────┐
│             Preemptive Round-Robin Scheduler & Multitasking              │
│    Task Control Blocks (TCBs) | Time Quantum Management (50 ms)         │
│    Context Switching Engine via iretq & TSS.RSP0 Stack Switching        │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────────┐
│                   Memory Management Subsystem (Phase 3)                  │
│    Kernel Heap (kmalloc/kfree) | VMM 4-Level Paging | PMM Frame Bitmap   │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────────┐
│                 Hardware Tables & Interrupts (Phase 2)                   │
│    64-bit GDT & TSS (IST1 #DF) | 256-Gate IDT | Remapped 8259 PIC | PIT  │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────────┐
│                 Bootstrap & Long Mode Transition (Phase 1)               │
│    Dual Multiboot1 / Multiboot2 | 32-to-64 Bit Trampoline | VGA 0xB8000  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Source Tree

```
myos64/
├── arch/
│   └── x86_64/
│       ├── boot/
│       │   ├── multiboot_header.asm   # Dual Multiboot1 & Multiboot2 headers
│       │   └── boot.asm               # 32-bit to 64-bit bootstrap engine
│       ├── cpu/
│       │   ├── gdt.h / gdt.c          # GDT64, TSS, and IST1 emergency stack
│       │   ├── idt.h / idt.c          # 256-entry 64-bit IDT table setup
│       │   ├── isr.h / isr.c          # Register frames, exception dumps & IRQ router
│       │   ├── interrupts.asm         # 32 exception & 16 IRQ assembly stubs
│       │   ├── syscall.h / syscall.c  # Fast SYSCALL/SYSRET MSRs & dispatcher
│       │   └── syscall_entry.asm      # Fast system call assembly trampoline
│       ├── drivers/
│       │   ├── pic.h / pic.c          # 8259 PIC remapping (vectors 32-47)
│       │   ├── pit.h / pit.c          # 8254 PIT 100 Hz timer & sleep
│       │   ├── keyboard.h / keyboard.c# Interrupt-driven PS/2 keyboard & ring buffer
│       │   └── serial.h / serial.c    # 16550 UART serial driver (COM1 at 0x3F8)
│       ├── mm/
│       │   ├── mboot.h                # Multiboot 1 & 2 memory map structures
│       │   ├── pmm.h / pmm.c          # Physical Memory Manager (Bitmap)
│       │   ├── vmm.h / vmm.c          # Virtual Memory Manager (4-Level Paging)
│       │   └── heap.h / heap.c        # Dynamic Heap (kmalloc / kfree)
│       ├── task/
│       │   ├── task.h / task.c        # Task Control Blocks & stack setup
│       │   └── sched.h / sched.c      # Preemptive round-robin scheduler
│       └── link.ld                    # Linker script with _kernel_start / _kernel_end
├── drivers/
│   ├── vga.c                          # Direct video memory driver (0xB8000)
│   └── vga.h                          # VGA API & 16-color palette
├── include/
│   └── types.h                        # Freestanding primitive types
├── kernel/
│   ├── kmain.c                        # 64-bit C kernel entry point
│   └── shell.h / shell.c              # Interactive kernel shell & command dispatcher
└── Makefile                           # Build, run, and debug automation
```

---

## ⚡ Building and Simulating

### Prerequisites
Inside WSL (Ubuntu) or Linux:
```bash
sudo apt update
sudo apt install -y build-essential nasm qemu-system-x86 gdb
```

### 1. Build the OS Image
```bash
cd myos64
make clean && make
```
Produces `build/kernel.elf`.

### 2. Launch in QEMU
```bash
make run
```
Launches QEMU running your 64-bit operating system with `-serial stdio` enabled.

---

## 💻 Interactive Shell Commands

| Command | Description |
|---------|-------------|
| `help` | Lists available commands and syntax |
| `clear` | Clears the 80x25 VGA console |
| `about` | Displays complete OS architecture and subsystem breakdown |
| `meminfo` | Displays live physical RAM (PMM) and dynamic heap usage metrics (VMM) |
| `alloc <bytes>` | Dynamically allocates memory from kernel heap using `kmalloc()` |
| `free <hex_ptr>` | Deallocates memory block and coalesces adjacent heap space |
| `echo <text>` | Prints arguments back to console and serial port |
| `time` | Displays system uptime in seconds and total PIT timer ticks |
| `ps` | Lists active processes, states (RUNNING, READY, TERMINATED), and PIDs |
| `spawn` | Spawns concurrent background worker tasks to demonstrate preemptive time-slicing |
| `ring3` | Drops privilege to Ring 3 User Mode, executes user code, and tests `SYSCALL` |
| `panic` | Intentionally triggers a Division-by-Zero CPU exception (#DE) to test register dump |
| `reboot` | Triggers a clean hardware reboot via 8042 controller |

---

## 🧪 Advanced GDB Debugging
To inspect registers or step through instructions in real time:
```bash
# Terminal 1:
make debug

# Terminal 2:
gdb build/kernel.elf -ex "target remote localhost:1234" -ex "break kmain" -ex "continue"
```
Inspect state:
```gdb
(gdb) info registers rip rsp cr0 cr3 cr4 efer
(gdb) x/10i $rip
```
