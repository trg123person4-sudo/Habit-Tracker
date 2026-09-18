# Running MyOS64 on a Virtual Phone (or Physical Phone)

This guide explains step-by-step how to run **MyOS64** inside an **Android Virtual Device (Virtual Phone)** or a physical smartphone.

---

## 📱 Option A: Running via Limbo PC Emulator (Virtual Phone / Android)

**Limbo PC Emulator** is an open-source QEMU port for Android. It emulates full x86_64 PC hardware and provides on-screen touch keyboard and display output.

### Step 1: Install Limbo on the Virtual Phone (or Physical Phone)
1. Download the official Limbo APK:
   * **GitHub Releases:** [github.com/limboemu/limbo/releases](https://github.com/limboemu/limbo/releases)
   * Download `limbo-android-x86-<version>.apk` (or the universal APK).
2. Install the APK inside your virtual phone emulator (such as Android Studio AVD, BlueStacks, LDPlayer, or Nox) or on your physical phone.

### Step 2: Transfer the Kernel or ISO to the Phone
You can use either:
* **Option 1 (Direct Kernel):** `build/kernel.elf`
* **Option 2 (Bootable ISO):** `build/myos64.iso` (generated via `make iso`)

Copy the file to your phone's `Downloads` or internal storage folder.

### Step 3: Configure Limbo Virtual Machine
Open the Limbo app and configure a new machine:

1. **Load Machine:** Select **New** $\to$ Name it `MyOS64`.
2. **Architecture:** `x86_64`
3. **Machine Type:** `PC`
4. **CPU Model:** `qemu64` (or `max`)
5. **CPU Cores:** `1`
6. **RAM Memory:** `128 MB` (or `256 MB`)
7. **Storage / Boot:**
   * *If using Direct Kernel:*
     * Go to **Boot Settings**
     * **Kernel:** Tap browse and select `kernel.elf`
   * *If using ISO:*
     * Go to **Storage** $\to$ **CDROM** $\to$ Select `myos64.iso`
     * Go to **Boot Settings** $\to$ **Boot from Device** $\to$ Select `CDROM`
8. **Graphics:** `std` (or `vmware`)
9. **User Interface:** `SDL` or `VNC` (SDL provides the best direct touchscreen experience).

### Step 4: Start the OS
1. Tap the green **Play / Start** button at the top.
2. The phone screen will display the boot sequence and the **MyOS64** banner!
3. Tap the screen or the keyboard icon to bring up the Android on-screen keyboard.
4. Type `help`, `meminfo`, `ps`, or `spawn` right from your phone touch screen!

---

## 🌐 Option B: Instant Mobile Web Simulation (Zero Installation)

If you want to test the OS on your phone right now without installing any APKs:

1. Open your smartphone browser (Chrome, Safari, Firefox).
2. Navigate to: **[copy.sh/v86](https://copy.sh/v86/)** (an open-source x86_64 PC emulator running in WebAssembly).
3. Under the **CD Image** section, upload `myos64.iso`.
4. Tap **Start Emulation**.
5. MyOS64 will boot directly inside your mobile phone browser with full touch keyboard support!

---

## 🛠️ How to Generate `myos64.iso` on your PC

Inside your build environment:
```bash
cd myos64
make iso
```
This automatically invokes [`build_iso.sh`](file:///c:/Users/A/Desktop/New%20folder%20(2)/myos64/build_iso.sh) and creates `build/myos64.iso`.
