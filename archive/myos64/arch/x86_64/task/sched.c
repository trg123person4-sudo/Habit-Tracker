/* =============================================================================
 * sched.c — Preemptive Round-Robin Process Scheduler Implementation
 * =============================================================================
 * Dispatches CPU execution time slices across circular task queues, updates TSS.RSP0
 * on privilege transitions, and swaps register contexts via iretq frames.
 * ============================================================================= */

#include "sched.h"
#include "gdt.h"

static task_t *current_task = NULL;
static task_t *task_head    = NULL;
static bool sched_enabled   = false;

/* -----------------------------------------------------------------------------
 * Initialize scheduler with the initial kernel shell thread
 * ----------------------------------------------------------------------------- */
void sched_init(void) {
    task_t *main_task = task_create_main("kernel_shell");
    if (!main_task) return;

    main_task->next = main_task;      /* Circular single-node list */
    current_task = main_task;
    task_head    = main_task;
    sched_enabled = true;
}

/* -----------------------------------------------------------------------------
 * Add task to circular round-robin list
 * ----------------------------------------------------------------------------- */
void sched_add_task(task_t *task) {
    if (!task || !task_head) return;

    /* Atomically insert into circular chain */
    uint64_t rflags;
    __asm__ volatile ("pushfq; pop %0; cli" : "=r"(rflags) : : "memory");

    task->next = task_head->next;
    task_head->next = task;

    __asm__ volatile ("push %0; popfq" : : "r"(rflags) : "memory");
}

/* -----------------------------------------------------------------------------
 * Scheduler Timer Tick Handler (Invoked every 10 ms from PIT IRQ 0)
 * ----------------------------------------------------------------------------- */
interrupt_frame_t *sched_tick(interrupt_frame_t *frame) {
    if (!sched_enabled || !current_task) {
        return frame;
    }

    /* Decrement time slice */
    if (current_task->time_slice > 0) {
        current_task->time_slice--;
    }

    /* If quantum still active, remain on current task */
    if (current_task->time_slice > 0) {
        return frame;
    }

    /* Quantum expired: Reset quantum and initiate task switch */
    current_task->time_slice = TASK_DEFAULT_QUANTUM;
    current_task->rsp = (uint64_t)frame;

    if (current_task->state == TASK_STATE_RUNNING) {
        current_task->state = TASK_STATE_READY;
    }

    /* Locate next ready task in circular list */
    task_t *next = current_task->next;
    while (next != current_task && next->state != TASK_STATE_READY) {
        next = next->next;
    }

    /* If no other ready task exists, continue current task */
    if (next->state != TASK_STATE_READY) {
        current_task->state = TASK_STATE_RUNNING;
        return frame;
    }

    /* Perform Context Switch */
    current_task = next;
    current_task->state = TASK_STATE_RUNNING;

    /* Update TSS.RSP0 for user-to-kernel privilege transitions */
    if (current_task->kernel_stack != 0) {
        gdt_set_kernel_stack(current_task->kernel_stack);
    }

    /* Return newly scheduled task's saved interrupt frame pointer */
    return (interrupt_frame_t *)current_task->rsp;
}

/* -----------------------------------------------------------------------------
 * Yield current time slice voluntarily
 * ----------------------------------------------------------------------------- */
void sched_yield(void) {
    if (current_task) {
        current_task->time_slice = 0;
    }
    /* Wait for next timer tick */
    __asm__ volatile ("hlt");
}

/* -----------------------------------------------------------------------------
 * Scheduler Accessors
 * ----------------------------------------------------------------------------- */
task_t *sched_get_current(void) {
    return current_task;
}

task_t *sched_get_task_list(void) {
    return task_head;
}
