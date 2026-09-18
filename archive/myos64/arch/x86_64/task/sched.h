/* =============================================================================
 * sched.h — Preemptive Round-Robin Process Scheduler
 * =============================================================================
 * Time-sliced scheduler driven by 100 Hz PIT hardware timer ticks.
 * Manages task queues, preemption, quantum countdown, and context switching.
 * ============================================================================= */

#ifndef MYOS_TASK_SCHED_H
#define MYOS_TASK_SCHED_H

#include "types.h"
#include "task.h"
#include "isr.h"

/* Scheduler API */
void sched_init(void);
void sched_add_task(task_t *task);
interrupt_frame_t *sched_tick(interrupt_frame_t *frame);
task_t *sched_get_current(void);
task_t *sched_get_task_list(void);
void sched_yield(void);

#endif /* MYOS_TASK_SCHED_H */
