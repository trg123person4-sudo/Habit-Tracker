# =============================================================================
# MyOS64 — Build Automation & QEMU Simulation Makefile
# =============================================================================
# Targets:
#   make          - Compiles and links kernel into build/kernel.elf
#   make run      - Launches kernel inside QEMU x86_64 emulator
#   make iso      - Packages kernel into a bootable ISO (build/myos64.iso)
#   make debug    - Runs QEMU with GDB stub enabled (port 1234, halted)
#   make clean    - Removes all compiled objects and build artifacts
# =============================================================================

# Toolchain configuration (Cross-compiler or system 64-bit GCC)
CC   ?= gcc
LD   ?= ld
ASM  ?= nasm
QEMU ?= qemu-system-x86_64

# Compiler flags for 64-bit freestanding kernel development
CFLAGS := -m64 \
          -std=gnu11 \
          -ffreestanding \
          -fno-builtin \
          -fno-stack-protector \
          -mno-red-zone \
          -mno-mmx \
          -mno-sse \
          -mno-sse2 \
          -Wall \
          -Wextra \
          -Iinclude \
          -Idrivers \
          -Iarch/x86_64/cpu \
          -Iarch/x86_64/drivers \
          -Iarch/x86_64/mm \
          -Iarch/x86_64/task \
          -Ikernel \
          -O2 \
          -g

# Assembler flags (ELF64 object format)
ASMFLAGS := -f elf64

# Linker flags
LDFLAGS := -n \
           -T arch/x86_64/link.ld \
           -m elf_x86_64 \
           -nostdlib

# Directory structure
BUILD_DIR := build
KERNEL_ELF := $(BUILD_DIR)/kernel.elf
KERNEL_ISO := $(BUILD_DIR)/myos64.iso

# Source definitions
ASM_SRCS := arch/x86_64/boot/multiboot_header.asm \
            arch/x86_64/boot/boot.asm \
            arch/x86_64/cpu/interrupts.asm \
            arch/x86_64/cpu/syscall_entry.asm

C_SRCS   := kernel/kmain.c \
            kernel/shell.c \
            drivers/vga.c \
            arch/x86_64/cpu/gdt.c \
            arch/x86_64/cpu/idt.c \
            arch/x86_64/cpu/isr.c \
            arch/x86_64/cpu/syscall.c \
            arch/x86_64/drivers/pic.c \
            arch/x86_64/drivers/pit.c \
            arch/x86_64/drivers/keyboard.c \
            arch/x86_64/drivers/serial.c \
            arch/x86_64/mm/pmm.c \
            arch/x86_64/mm/vmm.c \
            arch/x86_64/mm/heap.c \
            arch/x86_64/task/task.c \
            arch/x86_64/task/sched.c

# Object mapping
ASM_OBJS := $(patsubst %.asm, $(BUILD_DIR)/%.o, $(ASM_SRCS))
C_OBJS   := $(patsubst %.c, $(BUILD_DIR)/%.o, $(C_SRCS))
ALL_OBJS := $(ASM_OBJS) $(C_OBJS)

# =============================================================================
# Build Rules
# =============================================================================

.PHONY: all run iso debug clean

all: $(KERNEL_ELF)
	@echo "--------------------------------------------------------"
	@echo "  MyOS64 build successful: $(KERNEL_ELF)"
	@echo "  Execute 'make run' to launch in QEMU"
	@echo "  Execute 'make iso' to generate bootable myos64.iso"
	@echo "--------------------------------------------------------"

$(KERNEL_ELF): $(ALL_OBJS) arch/x86_64/link.ld
	@mkdir -p $(dir $@)
	$(LD) $(LDFLAGS) -o $@ $(ALL_OBJS)

# Compile assembly sources
$(BUILD_DIR)/%.o: %.asm
	@mkdir -p $(dir $@)
	$(ASM) $(ASMFLAGS) $< -o $@

# Compile C sources
$(BUILD_DIR)/%.o: %.c
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

# Run in QEMU emulator with serial mapped to stdio
run: $(KERNEL_ELF)
	$(QEMU) -kernel $(KERNEL_ELF) -serial stdio

# Generate bootable ISO for mobile emulators (Limbo / Virtual Phone)
iso: $(KERNEL_ELF)
	@bash ./build_iso.sh

# Run in QEMU awaiting GDB connection on localhost:1234
debug: $(KERNEL_ELF)
	$(QEMU) -kernel $(KERNEL_ELF) -serial stdio -s -S

# Clean all generated files
clean:
	rm -rf $(BUILD_DIR)
