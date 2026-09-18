# ============================================================
# MyOS Makefile
# ============================================================
# Builds the bootloader and kernel, then combines them into
# a bootable disk image.
#
# Usage:
#   make          — Build the OS image
#   make run      — Build and run in QEMU
#   make clean    — Remove all build artifacts
# ============================================================

# --- Toolchain ---
# Option 1: Cross-compiler (recommended, proper way)
#CC  = i686-elf-gcc
#LD  = i686-elf-ld

# Option 2: System GCC with 32-bit flags (easier to set up)
CC  = gcc
LD  = ld

ASM = nasm

# --- Compiler/Linker Flags ---
CFLAGS  = -m32 -ffreestanding -nostdlib -nostdinc -fno-builtin \
          -fno-stack-protector -nostartfiles -nodefaultlibs \
          -Wall -Wextra -Ikernel
LDFLAGS = -m elf_i386 -T linker.ld --oformat binary

# If using i686-elf cross-compiler, use these LDFLAGS instead:
#LDFLAGS = -T linker.ld --oformat binary

# --- Source Files ---
KERNEL_C_SOURCES = $(wildcard kernel/*.c)
KERNEL_C_OBJECTS = $(KERNEL_C_SOURCES:.c=.o)

# ============================================================
# Build Targets
# ============================================================

all: os-image.bin
	@echo ""
	@echo "======================================"
	@echo "  MyOS built successfully!"
	@echo "  Run: make run"
	@echo "======================================"

# Combine boot sector + kernel into one disk image
os-image.bin: boot/boot.bin kernel.bin
	cat boot/boot.bin kernel.bin > os-image.bin

# Assemble the bootloader (raw binary, no linking)
boot/boot.bin: boot/boot.asm
	$(ASM) -f bin $< -o $@

# Link all kernel objects into a flat binary
kernel.bin: kernel/kernel_entry.o $(KERNEL_C_OBJECTS)
	$(LD) $(LDFLAGS) -o $@ $^

# Assemble kernel entry point
kernel/kernel_entry.o: kernel/kernel_entry.asm
	$(ASM) -f elf32 $< -o $@

# Compile C source files
kernel/%.o: kernel/%.c
	$(CC) $(CFLAGS) -c $< -o $@

# ============================================================
# Run in QEMU
# ============================================================
run: os-image.bin
	qemu-system-i386 -fda os-image.bin

# ============================================================
# Clean build artifacts
# ============================================================
clean:
	rm -f boot/*.bin kernel/*.o *.bin

.PHONY: all run clean
