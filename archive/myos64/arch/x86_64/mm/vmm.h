/* =============================================================================
 * vmm.h — Virtual Memory Manager (4-Level x86_64 Paging Engine)
 * =============================================================================
 * Manages 48-bit canonical virtual address translation across PML4, PDPT,
 * Page Directory, and Page Table structures with TLB invalidation.
 * ============================================================================= */

#ifndef MYOS_MM_VMM_H
#define MYOS_MM_VMM_H

#include "types.h"

/* 64-Bit Page Table Entry Flags */
#define PAGE_PRESENT      (1ULL << 0)
#define PAGE_WRITABLE     (1ULL << 1)
#define PAGE_USER         (1ULL << 2)
#define PAGE_WRITE_THRU   (1ULL << 3)
#define PAGE_NO_CACHE     (1ULL << 4)
#define PAGE_ACCESSED     (1ULL << 5)
#define PAGE_DIRTY        (1ULL << 6)
#define PAGE_HUGE         (1ULL << 7)
#define PAGE_GLOBAL       (1ULL << 8)
#define PAGE_NO_EXEC      (1ULL << 63)

/* Core VMM API */
void vmm_init(void);
void vmm_map_page(uintptr_t virt, uintptr_t phys, uint64_t flags);
void vmm_unmap_page(uintptr_t virt);
uintptr_t vmm_virt_to_phys(uintptr_t virt);

#endif /* MYOS_MM_VMM_H */
