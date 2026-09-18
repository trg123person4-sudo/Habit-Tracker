/* =============================================================================
 * task.h — Task Control Block (TCB) & Thread Lifecycle
 * =============================================================================
 * Manages task descriptors, private kernel/user stacks, and execution states
 * for preemptive multitasking and privilege separation.
 * ============================================================================= */

#ifndef MYOS_TASK_TASK_H
#define MYOS_TASK_TASK_H

#include "types.h"
#include "isr.h"

#define TASK_STACK_SIZE 8192          /* 8 KiB stack per task */
#define TASK_DEFAULT_QUANTUM 5        /* 5 timer ticks = 50 ms */

typedef enum {
    TASK_STATE_READY = 0,
    TASK_STATE_RUNNING = 1,
    TASK_STATE_SLEEPING = 2,
    TASK_STATE_TERMINATED = 3
} task_state_t;

typedef struct task {
    uint64_t pid;                     /* Process ID */
    task_state_t state;               /* Lifecycle state */
    uint64_t rsp;                     /* Saved stack pointer (points to interrupt_frame_t) */
    uint64_t cr3;                     /* Page directory (PML4) */
    uint64_t kernel_stack;            /* Top of kernel stack (TSS.RSP0) */
    uint64_t user_stack;              /* Top of user stack (Ring 3) */
    uint64_t time_slice;              /* Remaining ticks in quantum */
    char name[32];                    /* Task identifier */
    struct task *next;                /* Pointer in circular list */
} task_t;

/* Task API */
task_t *task_create(const char *name, void (*entry_point)(void), bool is_user);
task_t *task_create_main(const char *name);
void task_exit(void);

#endif /* MYOS_TASK_TASK_H */
