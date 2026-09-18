#!/bin/bash
# =============================================================================
# build_iso.sh — Creates a Bootable Hybrid ISO (myos64.iso) for QEMU & Limbo
# =============================================================================
# Uses grub-mkrescue and xorriso to create a bootable CDROM image compatible
# with PC emulators, virtual machines, and mobile phone emulators (Limbo).
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ensure kernel is built
if [ ! -f "build/kernel.elf" ]; then
    echo "[*] Building kernel.elf first..."
    make
fi

echo "[*] Constructing GRUB boot directory structure..."
mkdir -p build/isodir/boot/grub

# Copy 64-bit kernel ELF
cp build/kernel.elf build/isodir/boot/kernel.elf

# Generate GRUB configuration
cat << 'EOF' > build/isodir/boot/grub/grub.cfg
set timeout=0
set default=0

menuentry "MyOS64 (64-Bit Operating System)" {
    multiboot /boot/kernel.elf
    boot
}
EOF

# Build bootable ISO
echo "[*] Generating build/myos64.iso via grub-mkrescue..."
grub-mkrescue -o build/myos64.iso build/isodir

echo ""
echo "==============================================================="
echo "  SUCCESS: build/myos64.iso generated successfully!"
echo "  File size: $(ls -lh build/myos64.iso | awk '{print $5}')"
echo "==============================================================="
echo "  You can now copy build/myos64.iso or build/kernel.elf"
echo "  to your virtual phone or Android device to run in Limbo."
echo "==============================================================="
