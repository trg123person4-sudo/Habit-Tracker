/* =============================================================================
 * pmm.h — Physical Memory Manager (Bitmap Frame Allocator)
 * =============================================================================
 * Manages allocation and deallocation of 4 KiB physical memory frames using
 * a fast bitmap representation.
 * ============================================================================= */

#ifndef MYOS_MM_PMM_H
#define MYOS_MM_PMM_H

#include "types.h"

#define PAGE_SIZE 4096                /* 4 KiB per frame */

/* Core PMM API */
void pmm_init(uint64_t magic, uint64_t mboot_addr);
uintptr_t pmm_alloc_frame(void);
void pmm_free_frame(uintptr_t phys_addr);

/* Telemetry API */
size_t pmm_get_total_memory(void);
size_t pmm_get_free_memory(void);
size_t pmm_get_used_memory(void);

#endif /* MYOS_MM_PMM_H */
