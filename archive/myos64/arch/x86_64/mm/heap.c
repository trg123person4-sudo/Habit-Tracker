/* =============================================================================
 * heap.c — Kernel Dynamic Heap Allocator (kmalloc / kfree)
 * =============================================================================
 * Implements an intrusive linked-list memory allocator with block splitting,
 * adjacent free-block coalescing, and dynamic virtual page expansion.
 * ============================================================================= */

#include "heap.h"
#include "vmm.h"
#include "pmm.h"

#define ALIGN16(x) (((x) + 15) & ~15ULL)

typedef struct block_header {
    size_t size;                      /* Usable bytes (excluding this header) */
    bool is_free;                     /* Allocation status */
    struct block_header *next;        /* Pointer to next contiguous or linked block */
} block_header_t;

static uintptr_t heap_start = 0;
static uintptr_t heap_end   = 0;
static block_header_t *heap_head = 0;
static size_t total_allocated_bytes = 0;

/* -----------------------------------------------------------------------------
 * Expand heap by mapping additional physical frames to virtual heap boundary
 * ----------------------------------------------------------------------------- */
static bool kheap_expand(size_t bytes) {
    size_t pages = (bytes + PAGE_SIZE - 1) / PAGE_SIZE;
    uintptr_t new_heap_end = heap_end + pages * PAGE_SIZE;

    for (uintptr_t v = heap_end; v < new_heap_end; v += PAGE_SIZE) {
        uintptr_t p = pmm_alloc_frame();
        if (!p) return false;
        vmm_map_page(v, p, PAGE_PRESENT | PAGE_WRITABLE);
    }

    /* Initialize new region as a free block */
    block_header_t *new_block = (block_header_t *)heap_end;
    new_block->size = (pages * PAGE_SIZE) - sizeof(block_header_t);
    new_block->is_free = true;
    new_block->next = NULL;

    /* Append to end of block chain */
    block_header_t *curr = heap_head;
    while (curr->next) {
        curr = curr->next;
    }
    curr->next = new_block;

    heap_end = new_heap_end;
    return true;
}

/* -----------------------------------------------------------------------------
 * Coalesce contiguous free blocks in the heap list
 * ----------------------------------------------------------------------------- */
static void kheap_coalesce(void) {
    block_header_t *curr = heap_head;
    while (curr && curr->next) {
        /* If both current and next block are free, merge them */
        if (curr->is_free && curr->next->is_free) {
            curr->size += sizeof(block_header_t) + curr->next->size;
            curr->next = curr->next->next;
        } else {
            curr = curr->next;
        }
    }
}

/* -----------------------------------------------------------------------------
 * Initialize Kernel Heap Subsystem
 * ----------------------------------------------------------------------------- */
void kheap_init(uintptr_t start_addr, size_t initial_size) {
    heap_start = start_addr;
    heap_end   = start_addr;
    heap_head  = (block_header_t *)start_addr;

    /* Allocate and map initial heap pages */
    size_t pages = (initial_size + PAGE_SIZE - 1) / PAGE_SIZE;
    uintptr_t target_end = heap_start + pages * PAGE_SIZE;

    for (uintptr_t v = heap_start; v < target_end; v += PAGE_SIZE) {
        uintptr_t p = pmm_alloc_frame();
        vmm_map_page(v, p, PAGE_PRESENT | PAGE_WRITABLE);
    }

    heap_end = target_end;

    /* Initialize single monolithic free block */
    heap_head->size = (heap_end - heap_start) - sizeof(block_header_t);
    heap_head->is_free = true;
    heap_head->next = NULL;
}

/* -----------------------------------------------------------------------------
 * Allocate dynamic memory block (16-byte aligned payload)
 * ----------------------------------------------------------------------------- */
void *kmalloc(size_t size) {
    if (size == 0) return NULL;
    size = ALIGN16(size);

    block_header_t *curr = heap_head;

    while (curr) {
        if (curr->is_free && curr->size >= size) {
            /* Check if block can be split */
            if (curr->size >= size + sizeof(block_header_t) + 16) {
                block_header_t *split_block = (block_header_t *)((uintptr_t)curr + sizeof(block_header_t) + size);
                split_block->size = curr->size - size - sizeof(block_header_t);
                split_block->is_free = true;
                split_block->next = curr->next;

                curr->next = split_block;
                curr->size = size;
            }

            curr->is_free = false;
            total_allocated_bytes += curr->size;
            return (void *)((uintptr_t)curr + sizeof(block_header_t));
        }
        curr = curr->next;
    }

    /* Out of heap capacity: Expand heap by at least 64 KiB and retry */
    size_t expand_amount = size + sizeof(block_header_t);
    if (expand_amount < 64 * 1024) expand_amount = 64 * 1024;

    if (kheap_expand(expand_amount)) {
        kheap_coalesce();
        return kmalloc(size);
    }

    return NULL; /* Out of physical memory to expand heap */
}

/* -----------------------------------------------------------------------------
 * Allocate zero-initialized memory
 * ----------------------------------------------------------------------------- */
void *kzalloc(size_t size) {
    void *ptr = kmalloc(size);
    if (ptr) {
        uint8_t *byte_ptr = (uint8_t *)ptr;
        for (size_t i = 0; i < size; i++) {
            byte_ptr[i] = 0;
        }
    }
    return ptr;
}

/* -----------------------------------------------------------------------------
 * Free previously allocated memory block and coalesce adjacent regions
 * ----------------------------------------------------------------------------- */
void kfree(void *ptr) {
    if (!ptr) return;

    block_header_t *block = (block_header_t *)((uintptr_t)ptr - sizeof(block_header_t));
    block->is_free = true;
    if (total_allocated_bytes >= block->size) {
        total_allocated_bytes -= block->size;
    }

    /* Merge adjacent free blocks */
    kheap_coalesce();
}

/* -----------------------------------------------------------------------------
 * Telemetry getters
 * ----------------------------------------------------------------------------- */
size_t kheap_get_allocated_bytes(void) {
    return total_allocated_bytes;
}

size_t kheap_get_free_bytes(void) {
    size_t free_bytes = 0;
    block_header_t *curr = heap_head;
    while (curr) {
        if (curr->is_free) {
            free_bytes += curr->size;
        }
        curr = curr->next;
    }
    return free_bytes;
}
