; =============================================================================
; syscall_entry.asm — Hardware-Accelerated Fast System Call Trampoline
; =============================================================================
; Target of IA32_LSTAR MSR when user-space executes the SYSCALL instruction.
; Saves user context, switches to kernel stack, executes C dispatcher,
; and returns to Ring 3 via SYSRETQ.
; =============================================================================

[bits 64]
section .text

global syscall_entry
extern syscall_dispatch

syscall_entry:
    ; Hardware has already saved:
    ;   RCX = User RIP
    ;   R11 = User RFLAGS
    ;   RFLAGS masked by IA32_FMASK (Interrupts disabled)

    ; Switch from user stack to kernel syscall stack
    mov [rel saved_user_rsp], rsp
    mov rsp, [rel kernel_syscall_stack_top]

    ; Save user execution context
    push qword [rel saved_user_rsp] ; Saved User RSP
    push r11                        ; Saved User RFLAGS
    push rcx                        ; Saved User RIP
    push rbx
    push rbp
    push r12
    push r13
    push r14
    push r15

    ; System call arguments:
    ;   RDI = syscall number
    ;   RSI = arg 1
    ;   RDX = arg 2
    ;   R10 = arg 3 (x86_64 syscall ABI passes 4th param in R10)
    mov rcx, r10                    ; Forward 4th parameter to RCX for C function
    cld

    ; Call C dispatcher: uint64_t syscall_dispatch(num, a1, a2, a3)
    call syscall_dispatch

    ; Return value from C function is preserved in RAX

    ; Restore user execution context
    pop r15
    pop r14
    pop r13
    pop r12
    pop rbp
    pop rbx
    pop rcx                         ; Restore User RIP
    pop r11                         ; Restore User RFLAGS
    pop qword [rel saved_user_rsp]  ; Restore User RSP

    ; Reload user stack pointer
    mov rsp, [rel saved_user_rsp]

    ; Return to Ring 3 User Space (Hardware loads RIP from RCX, RFLAGS from R11)
    o64 sysret

section .bss
align 16
syscall_stack:
    resb 8192                       ; 8 KiB kernel stack for system call dispatch
syscall_stack_top:

section .data
align 8
kernel_syscall_stack_top: dq syscall_stack_top
saved_user_rsp:          dq 0
