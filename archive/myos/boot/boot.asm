; ============================================================
; MyOS Bootloader
; ============================================================
; Loaded by BIOS at 0x7C00 (512 bytes, ends with 0xAA55)
;
; What it does:
;   1. Sets up segments and stack
;   2. Loads the kernel from disk into memory at 0x1000
;   3. Switches the CPU to 32-bit Protected Mode
;   4. Jumps to the kernel
; ============================================================

[BITS 16]
[ORG 0x7C00]

KERNEL_OFFSET equ 0x1000       ; Where we load the kernel in memory

; ----------------------------------------------------------
; Entry point - BIOS jumps here after POST
; ----------------------------------------------------------
boot_start:
    ; Set up segment registers and stack
    xor ax, ax
    mov ds, ax
    mov es, ax
    mov ss, ax
    mov sp, 0x7C00              ; Stack grows downward from 0x7C00
    mov bp, sp

    mov [BOOT_DRIVE], dl        ; BIOS passes boot drive number in DL

    ; Print boot message
    mov si, MSG_BOOT
    call print_string_16

    ; Load kernel from disk
    call load_kernel

    ; Print success message
    mov si, MSG_LOADED
    call print_string_16

    ; Switch to 32-bit protected mode (no turning back!)
    call switch_to_pm

    jmp $                       ; Should never reach here

; ----------------------------------------------------------
; print_string_16: Print null-terminated string in real mode
; Input: SI = pointer to string
; ----------------------------------------------------------
print_string_16:
    pusha
.loop:
    lodsb                       ; Load byte from [SI] into AL, increment SI
    cmp al, 0
    je .done
    mov ah, 0x0E                ; BIOS teletype function
    int 0x10
    jmp .loop
.done:
    popa
    ret

; ----------------------------------------------------------
; load_kernel: Read kernel sectors from boot disk
; ----------------------------------------------------------
load_kernel:
    mov bx, KERNEL_OFFSET       ; Destination: ES:BX = 0x0000:0x1000
    mov ah, 0x02                ; BIOS function: read sectors
    mov al, 30                  ; Number of sectors to read
    mov ch, 0                   ; Cylinder 0
    mov cl, 2                   ; Start from sector 2 (sector 1 = this boot sector)
    mov dh, 0                   ; Head 0
    mov dl, [BOOT_DRIVE]        ; Drive number
    int 0x13                    ; Call BIOS disk interrupt
    jc disk_error               ; Jump if carry flag set (error)
    ret

disk_error:
    mov si, MSG_DISK_ERR
    call print_string_16
    jmp $                       ; Hang on error

; ----------------------------------------------------------
; GDT (Global Descriptor Table)
; Defines memory segments for protected mode
; ----------------------------------------------------------
gdt_start:
    ; Null descriptor (required by CPU, must be all zeros)
    dd 0x0
    dd 0x0

gdt_code:
    ; Code segment descriptor
    ; Base = 0x0, Limit = 0xFFFFF (4GB with 4KB granularity)
    ; Flags: present, ring 0, executable, readable
    dw 0xFFFF                   ; Limit (bits 0-15)
    dw 0x0                     ; Base (bits 0-15)
    db 0x0                     ; Base (bits 16-23)
    db 10011010b               ; Access byte
    db 11001111b               ; Flags + Limit (bits 16-19)
    db 0x0                     ; Base (bits 24-31)

gdt_data:
    ; Data segment descriptor
    ; Same as code but with data flags (writable, not executable)
    dw 0xFFFF
    dw 0x0
    db 0x0
    db 10010010b               ; Access byte
    db 11001111b               ; Flags + Limit (bits 16-19)
    db 0x0

gdt_end:

gdt_descriptor:
    dw gdt_end - gdt_start - 1 ; GDT size (bytes - 1)
    dd gdt_start                ; GDT address

; Segment selector constants
CODE_SEG equ gdt_code - gdt_start
DATA_SEG equ gdt_data - gdt_start

; ----------------------------------------------------------
; switch_to_pm: Enter 32-bit Protected Mode
; ----------------------------------------------------------
switch_to_pm:
    cli                         ; Disable interrupts
    lgdt [gdt_descriptor]       ; Load GDT register

    ; Set PE (Protection Enable) bit in CR0
    mov eax, cr0
    or eax, 0x1
    mov cr0, eax

    ; Far jump to 32-bit code — flushes the CPU pipeline
    jmp CODE_SEG:init_pm

; ----------------------------------------------------------
; 32-bit Protected Mode initialization
; ----------------------------------------------------------
[BITS 32]
init_pm:
    ; Update all segment registers to use the data segment
    mov ax, DATA_SEG
    mov ds, ax
    mov es, ax
    mov fs, ax
    mov gs, ax
    mov ss, ax
    mov ebp, 0x90000            ; Set up new stack
    mov esp, ebp

    jmp KERNEL_OFFSET           ; Jump to kernel! 🚀

; ----------------------------------------------------------
; Data section
; ----------------------------------------------------------
BOOT_DRIVE:   db 0
MSG_BOOT:     db "Booting MyOS...", 13, 10, 0
MSG_LOADED:   db "Kernel loaded.", 13, 10, 0
MSG_DISK_ERR: db "Disk read error!", 0

; ----------------------------------------------------------
; Boot sector padding and magic number
; ----------------------------------------------------------
times 510 - ($ - $$) db 0      ; Pad to 510 bytes
dw 0xAA55                      ; Boot signature
