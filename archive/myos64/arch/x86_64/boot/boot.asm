; =============================================================================
; boot.asm — 32-bit Bootstrap Trampoline into 64-bit Long Mode
; =============================================================================
; Responsibilities:
;   1. Receive execution from Multiboot bootloader in 32-bit Protected Mode.
;   2. Save Multiboot parameters (magic in EAX, info pointer in EBX).
;   3. Verify CPU capabilities (CPUID instruction & x86_64 Long Mode).
;   4. Initialize early 4-level paging hierarchy (PML4, PDPT, PD with 2MiB pages).
;   5. Enable PAE, EFER.LME (Long Mode Enable), and CR0.PG (Paging).
;   6. Load 64-bit Global Descriptor Table (GDT64).
;   7. Perform far jump into 64-bit Long Mode code segment.
;   8. Align stack to 16 bytes (System V ABI requirement) and call kmain().
; =============================================================================

[bits 32]

global _start
extern kmain

section .text
_start:
    ; Disable interrupts immediately
    cli

    ; Initialize temporary bootstrap stack
    mov esp, stack_top

    ; Preserve Multiboot bootloader registers
    mov [multiboot_magic], eax
    mov [multiboot_info], ebx

    ; Run pre-flight hardware sanity checks
    call check_cpuid
    call check_long_mode

    ; Set up 4-level page tables (PML4 -> PDPT -> PD)
    call setup_page_tables

    ; Enable paging and transition CPU to 64-bit mode
    call enable_paging

    ; Load 64-bit GDT
    lgdt [gdt64_descriptor]

    ; Far jump to 64-bit code segment (flushes 32-bit prefetch queue)
    jmp gdt64_code:long_mode_entry

; -----------------------------------------------------------------------------
; Hardware Sanity Check: CPUID instruction support
; Tests if bit 21 (ID bit) in EFLAGS can be flipped.
; -----------------------------------------------------------------------------
check_cpuid:
    pushfd
    pop eax
    mov ecx, eax              ; Save original EFLAGS
    xor eax, 1 << 21          ; Toggle bit 21
    push eax
    popfd
    pushfd
    pop eax                   ; Read modified EFLAGS
    push ecx
    popfd                     ; Restore original EFLAGS
    xor eax, ecx              ; Did bit 21 stay flipped?
    jz .no_cpuid              ; If zero, CPUID is not supported
    ret
.no_cpuid:
    mov al, "1"               ; Error code 1: No CPUID
    jmp error_hang

; -----------------------------------------------------------------------------
; Hardware Sanity Check: 64-bit Long Mode support
; Queries CPUID extended processor information.
; -----------------------------------------------------------------------------
check_long_mode:
    ; Check if extended function 0x80000001 is supported
    mov eax, 0x80000000
    cpuid
    cmp eax, 0x80000001
    jb .no_long_mode

    ; Query extended features (EDX bit 29 = Long Mode)
    mov eax, 0x80000001
    cpuid
    test edx, 1 << 29
    jz .no_long_mode
    ret
.no_long_mode:
    mov al, "2"               ; Error code 2: No 64-bit Long Mode
    jmp error_hang

; -----------------------------------------------------------------------------
; Setup Early 4-Level Paging
; Maps first 1 GiB of physical memory using 2 MiB huge pages.
; -----------------------------------------------------------------------------
setup_page_tables:
    ; Link PML4 entry 0 -> PDPT (Present | Writable = 0x03)
    mov eax, pdpt_table
    or eax, 0x03
    mov [pml4_table], eax

    ; Link PDPT entry 0 -> Page Directory (Present | Writable = 0x03)
    mov eax, pd_table
    or eax, 0x03
    mov [pdpt_table], eax

    ; Populate Page Directory: 512 entries of 2 MiB huge pages = 1 GiB mapped
    ; Each entry: physical_address | 0x83 (Present | Writable | Huge Page 2MiB)
    mov ecx, 0
.map_pd_loop:
    mov eax, 0x200000         ; 2 MiB = 0x200000 bytes
    mul ecx                   ; EAX = ecx * 2 MiB
    or eax, 0x83              ; Present (bit 0), Writable (bit 1), Huge Page (bit 7)
    mov [pd_table + ecx * 8], eax
    mov dword [pd_table + ecx * 8 + 4], 0  ; High 32 bits = 0

    inc ecx
    cmp ecx, 512              ; Map all 512 entries
    jne .map_pd_loop
    ret

; -----------------------------------------------------------------------------
; Enable Paging & Activate Long Mode
; -----------------------------------------------------------------------------
enable_paging:
    ; Load CR3 with physical address of PML4
    mov eax, pml4_table
    mov cr3, eax

    ; Enable Physical Address Extension (PAE) in CR4 (bit 5)
    mov eax, cr4
    or eax, 1 << 5
    mov cr4, eax

    ; Enable Long Mode (LME bit 8) in IA32_EFER MSR (0xC0000080)
    mov ecx, 0xC0000080
    rdmsr
    or eax, 1 << 8
    wrmsr

    ; Enable Paging (PG bit 31) and Protected Mode (PE bit 0) in CR0
    mov eax, cr0
    or eax, (1 << 31) | (1 << 0)
    mov cr0, eax
    ret

; -----------------------------------------------------------------------------
; Error Hang: Writes red error code to top-left of VGA buffer and halts
; -----------------------------------------------------------------------------
error_hang:
    mov dword [0xB8000], 0x4F524F45 ; "ER" in red on white
    mov byte  [0xB8004], al          ; Error code ASCII digit
    mov byte  [0xB8005], 0x4F
    cli
.hang:
    hlt
    jmp .hang

; =============================================================================
; 64-Bit Global Descriptor Table (GDT)
; =============================================================================
section .rodata
align 8
gdt64:
    dq 0x0000000000000000     ; Null descriptor (required)
gdt64_code equ $ - gdt64
    ; 64-bit Code Segment: Executable, Readable, Long Mode (L=1, D=0)
    dq 0x00209A0000000000
gdt64_data equ $ - gdt64
    ; 64-bit Data Segment: Writable, Present
    dq 0x0000920000000000
gdt64_descriptor:
    dw $ - gdt64 - 1          ; GDT Limit
    dq gdt64                  ; GDT Base Address

; =============================================================================
; 64-Bit Mode Entry Point
; =============================================================================
[bits 64]
section .text
long_mode_entry:
    ; Reset segment registers to null / data selector
    mov ax, gdt64_data
    mov ds, ax
    mov es, ax
    mov fs, ax
    mov gs, ax
    mov ss, ax

    ; Setup 64-bit kernel stack
    mov rsp, stack_top

    ; Enforce System V AMD64 ABI 16-byte stack alignment
    and rsp, -16

    ; Pass bootloader parameters per System V AMD64 ABI:
    ;   RDI = First argument (Multiboot magic)
    ;   RSI = Second argument (Multiboot info physical address)
    mov edi, [multiboot_magic]
    mov esi, [multiboot_info]

    ; Transfer control to the C kernel
    call kmain

    ; If kmain unexpectedly returns, halt CPU permanently
    cli
.halt:
    hlt
    jmp .halt

; =============================================================================
; Early BSS Section: Stack & 4-Level Page Tables (4096-byte aligned)
; =============================================================================
section .bss
align 4096
pml4_table:
    resb 4096
pdpt_table:
    resb 4096
pd_table:
    resb 4096

align 16
stack_bottom:
    resb 16384                ; 16 KiB initial kernel stack
stack_top:

section .data
align 4
multiboot_magic: dd 0
multiboot_info:  dd 0
