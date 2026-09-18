/* =============================================================================
 * heap.h — Kernel Dynamic Heap Allocator (kmalloc / kfree)
 * =============================================================================
 * Boundary-tag intrusive block allocator with contiguous free-block coalescing,
 * 16-byte alignment, and automatic virtual page expansion.
 * ============================================================================= */

#ifndef MYOS_MM_HEAP_H
#define MYOS_MM_HEAP_H

#include "types.h"

#define KHEAP_DEFAULT_VIRT_BASE 0x0000000040000000ULL /* 1 GiB virtual boundary */
#define KHEAP_INITIAL_SIZE      (1024 * 1024)          /* 1 MiB initial heap */

/* Core Heap API */
void kheap_init(uintptr_t start_addr, size_t initial_size);
void *kmalloc(size_t size);
void *kzalloc(size_t size);
void kfree(void *ptr);

/* Telemetry API */
size_t kheap_get_allocated_bytes(void);
size_t kheap_get_free_bytes(void);

#endif /* MYOS_MM_HEAP_H */
