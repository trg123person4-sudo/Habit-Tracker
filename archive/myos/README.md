# MyOS — Your Own Operating System 🚀

A minimal operating system built from scratch in **C** and **x86 Assembly**.

Boots on any x86 PC (or emulator), displays a welcome screen, and gives you
an interactive shell — all without any existing OS underneath!

---

## 📁 Project Structure

```
myos/
├── boot/
│   └── boot.asm           # Bootloader (loads kernel, switches to 32-bit mode)
├── kernel/
│   ├── kernel_entry.asm   # ASM → C bridge (calls kernel_main)
│   ├── kernel.c           # Main kernel + shell
│   ├── screen.c / .h      # VGA text mode display driver
│   ├── keyboard.c / .h    # PS/2 keyboard driver (polling)
│   └── ports.h            # Low-level I/O port access
├── linker.ld              # Kernel memory layout
├── Makefile               # Build system
├── setup.sh               # One-time tool installer (for WSL/Ubuntu)
└── README.md              # You are here!
```

---

## 🛠️ Setup (One-Time)

### Step 1: Install WSL (if you don't have it)

Open **PowerShell as Administrator** and run:

```powershell
wsl --install
```

Restart your PC, then open **Ubuntu** from the Start Menu.

### Step 2: Install development tools

Inside WSL (Ubuntu terminal):

```bash
# Navigate to the project (adjust the path to match your setup)
cd /mnt/c/Users/A/Desktop/New\ folder\ \(2\)/myos

# Run the setup script
chmod +x setup.sh
./setup.sh
```

This installs: `gcc`, `nasm`, `make`, `qemu-system-x86`, and 32-bit libraries.

---

## 🔨 Build & Run

```bash
# Build the OS image
make

# Run it in QEMU (a virtual PC)
make run
```

A QEMU window will pop up with your OS running! 🎉

### Shell Commands

Once MyOS boots, you can type:

| Command  | What it does              |
|----------|---------------------------|
| `help`   | Show available commands   |
| `clear`  | Clear the screen          |
| `about`  | Display OS info           |
| `echo <text>` | Print text back     |
| `reboot` | Reboot the virtual machine |

---

## 🧠 How It Works

### Boot Process (what happens when you "turn on" the computer):

```
BIOS loads boot sector (512 bytes) from disk
  └─→ boot.asm runs in 16-bit Real Mode
       ├─ Loads kernel from disk into memory at 0x1000
       ├─ Sets up GDT (memory segment descriptors)
       ├─ Switches CPU to 32-bit Protected Mode
       └─ Jumps to kernel at 0x1000
            └─→ kernel_entry.asm calls kernel_main()
                 └─→ kernel.c takes over!
                      ├─ Clears screen (writes to VGA memory at 0xB8000)
                      ├─ Prints welcome banner
                      └─ Enters shell loop (read keyboard → execute command)
```

### Key Concepts

| Concept | File | What to learn |
|---------|------|---------------|
| **BIOS Boot** | `boot.asm` | How PCs start up, disk loading |
| **Protected Mode** | `boot.asm` | CPU modes, GDT, 16→32 bit switch |
| **VGA Text Mode** | `screen.c` | Direct video memory access |
| **I/O Ports** | `ports.h` | How the CPU talks to hardware |
| **Keyboard Input** | `keyboard.c` | Scancodes, PS/2 controller |
| **Linker Scripts** | `linker.ld` | Memory layout, sections |

---

## 🚀 What to Build Next

Ready to expand your OS? Here's a progression:

1. **Add more commands** — Easy! Just add cases in `handle_command()`
2. **Add colors** — Use the color constants in `screen.h`
3. **Simple calculator** — Parse numbers from command input
4. **Memory manager** — Allocate/free memory blocks
5. **Interrupt handling** — Set up IDT for hardware interrupts
6. **Timer** — Use the PIT (Programmable Interval Timer)
7. **Filesystem** — Read files from a FAT12/FAT16 disk
8. **Multitasking** — Context switching between processes
9. **User mode** — Ring 3 protection, system calls
10. **ELF loader** — Load and run external programs

---

## 📚 Learning Resources

- [OSDev Wiki](https://wiki.osdev.org) — The definitive OS development reference
- [OSDev Bare Bones Tutorial](https://wiki.osdev.org/Bare_Bones) — Minimal kernel guide
- [Writing a Simple OS — from Scratch](https://www.cs.bham.ac.uk/~exr/lectures/opsys/10_11/lectures/os-dev.pdf) — Free PDF book
- [Intel x86 Manual Vol. 3](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html) — Official CPU reference

---

## 🧹 Clean Build

```bash
make clean     # Remove all compiled files
make           # Rebuild from scratch
```

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| `gcc: error: unrecognized option '-m32'` | Install multilib: `sudo apt install gcc-multilib` |
| `nasm: command not found` | Install NASM: `sudo apt install nasm` |
| `qemu-system-i386: not found` | Install QEMU: `sudo apt install qemu-system-x86` |
| QEMU window is black | Rebuild: `make clean && make` |
| No WSL installed | Run `wsl --install` in PowerShell (Admin) |

---

**Happy OS hacking!** 🎉
