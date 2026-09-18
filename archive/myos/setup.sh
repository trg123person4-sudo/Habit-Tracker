#!/bin/bash
# ============================================================
# MyOS Setup Script
# ============================================================
# Run this ONCE inside WSL (Ubuntu) to install all the tools
# needed to build and run MyOS.
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
# ============================================================

set -e

echo "========================================"
echo "  MyOS Development Environment Setup"
echo "========================================"
echo ""

# Update package list
echo "[1/4] Updating package list..."
sudo apt update -y

# Install build tools
echo "[2/4] Installing build tools (gcc, make, nasm)..."
sudo apt install -y build-essential nasm gcc-multilib

# Install QEMU (x86 emulator)
echo "[3/4] Installing QEMU..."
sudo apt install -y qemu-system-x86

# Verify installations
echo "[4/4] Verifying installations..."
echo ""

echo -n "  gcc:   " && gcc --version | head -1
echo -n "  nasm:  " && nasm --version
echo -n "  make:  " && make --version | head -1
echo -n "  qemu:  " && qemu-system-i386 --version | head -1

echo ""
echo "========================================"
echo "  Setup complete! You're ready to go."
echo "========================================"
echo ""
echo "  Next steps:"
echo "    1. cd myos"
echo "    2. make        (build the OS)"
echo "    3. make run    (launch in QEMU)"
echo ""
