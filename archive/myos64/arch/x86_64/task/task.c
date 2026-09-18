/* =============================================================================
 * task.c — Task Control Block (TCB) & Thread Lifecycle Implementation
 * =============================================================================
 * Constructs task execution contexts with isolated stacks and registers.
 * Prepares initial interrupt frames for seamless preemption via iretq.
 * ============================================================================= */

#include "task.h"
#include "heap.h"

static uint64_t next_pid = 1;

static void strncpy(char *dest, const char *src, size_t n) {
    size_t i = 0;
    while (i < n - 1 && src[i] != '\0') {
        dest[i] = src[i];
        i++;
    }
    dest[i] = '\0';
}

/* -----------------------------------------------------------------------------
 * Create TCB representing currently running kernel main thread
 * ----------------------------------------------------------------------------- */
task_t *task_create_main(const char *name) {
    task_t *task = (task_t *)kmalloc(sizeof(task_t));
    if (!task) return NULL;

    task->pid = next_pid++;
    task->state = TASK_STATE_RUNNING;
    task->rsp = 0;
    task->cr3 = 0;
    task->kernel_stack = 0;
    task->user_stack = 0;
    task->time_slice = TASK_DEFAULT_QUANTUM;
    task->next = NULL;
    strncpy(task->name, name, sizeof(task->name));

    return task;
}

/* -----------------------------------------------------------------------------
 * Create a new concurrent task with independent stack and execution context
 * ----------------------------------------------------------------------------- */
task_t *task_create(const char *name, void (*entry_point)(void), bool is_user) {
    task_t *task = (task_t *)kmalloc(sizeof(task_t));
    if (!task) return NULL;

    void *kstack = kmalloc(TASK_STACK_SIZE);
    if (!kstack) {
        kfree(task);
        return NULL;
    }

    task->pid = next_pid++;
    task->state = TASK_STATE_READY;
    task->kernel_stack = (uint64_t)kstack + TASK_STACK_SIZE;
    task->time_slice = TASK_DEFAULT_QUANTUM;
    task->next = NULL;
    strncpy(task->name, name, sizeof(task->name));

    /* Initialize interrupt frame on task's kernel stack */
    uintptr_t frame_addr = task->kernel_stack - sizeof(interrupt_frame_t);
    interrupt_frame_t *frame = (interrupt_frame_t *)frame_addr;

    /* Zero general purpose registers */
    uint8_t *raw = (uint8_t *)frame;
    for (size_t i = 0; i < sizeof(interrupt_frame_t); i++) {
        raw[i] = 0;
    }

    frame->rip = (uint64_t)entry_point;
    frame->rflags = 0x202;            /* IF = 1 (Interrupts enabled) */
    frame->int_no = 32;
    frame->error_code = 0;

    if (!is_user) {
        /* Kernel Mode Task (Ring 0) */
        frame->cs  = 0x08;
        frame->ss  = 0x10;
        frame->rsp = (uint64_t)frame_addr;
        task->user_stack = 0;
    } else {
        /* User Mode Task (Ring 3) */
        void *ustack = kmalloc(TASK_STACK_SIZE);
        if (!ustack) {
            kfree(kstack);
            kfree(task);
            return NULL;
        }
        task->user_stack = (uint64_t)ustack + TASK_STACK_SIZE;

        frame->cs  = 0x20 | 3;        /* User Code Selector (0x23) */
        frame->ss  = 0x18 | 3;        /* User Data Selector (0x1B) */
        frame->rsp = task->user_stack;
    }

    task->rsp = (uint64_t)frame_addr;
    return task;
}

/* -----------------------------------------------------------------------------
 * Terminate calling task
 * ----------------------------------------------------------------------------- */
void task_exit(void) {
    /* Set state to terminated and wait for next preemption */
    while (1) {
        __asm__ volatile ("hlt");
    }
}
