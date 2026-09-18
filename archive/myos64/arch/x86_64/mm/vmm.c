/* =============================================================================
 * vmm.c — Virtual Memory Manager (4-Level x86_64 Paging Engine)
 * =============================================================================
 * Traverses and dynamically expands 4-level page tables (PML4 -> PDPT -> PD -> PT).
 * Splits 2 MiB huge pages into 4 KiB pages when needed and flushes the TLB.
 * ============================================================================= */

#include "vmm.h"
#include "pmm.h"

static uint64_t *kernel_pml4 = 0;

/* -----------------------------------------------------------------------------
 * Invalidate single page entry in CPU Translation Lookaside Buffer (TLB)
 * ----------------------------------------------------------------------------- */
static inline void invlpg(uintptr_t virt) {
    __asm__ volatile ("invlpg (%0)" : : "r"(virt) : "memory");
}

/* -----------------------------------------------------------------------------
 * Initialize VMM by locating active PML4 from CR3 register
 * ----------------------------------------------------------------------------- */
void vmm_init(void) {
    uintptr_t cr3_val;
    __asm__ volatile ("mov %%cr3, %0" : "=r"(cr3_val));
    kernel_pml4 = (uint64_t *)(cr3_val & ~0xFFFULL);
}

/* -----------------------------------------------------------------------------
 * Map a virtual page to a physical frame with specified attributes
 * ----------------------------------------------------------------------------- */
void vmm_map_page(uintptr_t virt, uintptr_t phys, uint64_t flags) {
    size_t pml4_idx = (virt >> 39) & 0x1FF;
    size_t pdpt_idx = (virt >> 30) & 0x1FF;
    size_t pd_idx   = (virt >> 21) & 0x1FF;
    size_t pt_idx   = (virt >> 12) & 0x1FF;

    /* Level 4: PML4 -> PDPT */
    if (!(kernel_pml4[pml4_idx] & PAGE_PRESENT)) {
        uintptr_t new_table = pmm_alloc_frame();
        if (!new_table) return;
        uint64_t *table_ptr = (uint64_t *)new_table;
        for (int i = 0; i < 512; i++) table_ptr[i] = 0;
        kernel_pml4[pml4_idx] = new_table | PAGE_PRESENT | PAGE_WRITABLE | (flags & PAGE_USER);
    }
    uint64_t *pdpt = (uint64_t *)(kernel_pml4[pml4_idx] & ~0xFFFULL);

    /* Level 3: PDPT -> Page Directory */
    if (!(pdpt[pdpt_idx] & PAGE_PRESENT)) {
        uintptr_t new_table = pmm_alloc_frame();
        if (!new_table) return;
        uint64_t *table_ptr = (uint64_t *)new_table;
        for (int i = 0; i < 512; i++) table_ptr[i] = 0;
        pdpt[pdpt_idx] = new_table | PAGE_PRESENT | PAGE_WRITABLE | (flags & PAGE_USER);
    }
    uint64_t *pd = (uint64_t *)(pdpt[pdpt_idx] & ~0xFFFULL);

    /* Level 2: Page Directory -> Page Table */
    if (pd[pd_idx] & PAGE_HUGE) {
        /* Split early boot 2 MiB huge page into 512 4-KiB page entries */
        uintptr_t huge_phys = pd[pd_idx] & ~0x1FFFFFULL;
        uintptr_t new_pt_frame = pmm_alloc_frame();
        if (!new_pt_frame) return;

        uint64_t *new_pt = (uint64_t *)new_pt_frame;
        for (size_t i = 0; i < 512; i++) {
            new_pt[i] = (huge_phys + i * PAGE_SIZE) | PAGE_PRESENT | PAGE_WRITABLE;
        }
        pd[pd_idx] = new_pt_frame | PAGE_PRESENT | PAGE_WRITABLE | (flags & PAGE_USER);
    } else if (!(pd[pd_idx] & PAGE_PRESENT)) {
        uintptr_t new_table = pmm_alloc_frame();
        if (!new_table) return;
        uint64_t *table_ptr = (uint64_t *)new_table;
        for (int i = 0; i < 512; i++) table_ptr[i] = 0;
        pd[pd_idx] = new_table | PAGE_PRESENT | PAGE_WRITABLE | (flags & PAGE_USER);
    }
    uint64_t *pt = (uint64_t *)(pd[pd_idx] & ~0xFFFULL);

    /* Level 1: Page Table Entry -> Physical Frame */
    pt[pt_idx] = (phys & ~0xFFFULL) | flags | PAGE_PRESENT;

    /* Flush TLB entry */
    invlpg(virt);
}

/* -----------------------------------------------------------------------------
 * Unmap virtual page
 * ----------------------------------------------------------------------------- */
void vmm_unmap_page(uintptr_t virt) {
    size_t pml4_idx = (virt >> 39) & 0x1FF;
    size_t pdpt_idx = (virt >> 30) & 0x1FF;
    size_t pd_idx   = (virt >> 21) & 0x1FF;
    size_t pt_idx   = (virt >> 12) & 0x1FF;

    if (!(kernel_pml4[pml4_idx] & PAGE_PRESENT)) return;
    uint64_t *pdpt = (uint64_t *)(kernel_pml4[pml4_idx] & ~0xFFFULL);

    if (!(pdpt[pdpt_idx] & PAGE_PRESENT)) return;
    uint64_t *pd = (uint64_t *)(pdpt[pdpt_idx] & ~0xFFFULL);

    if (!(pd[pd_idx] & PAGE_PRESENT) || (pd[pd_idx] & PAGE_HUGE)) return;
    uint64_t *pt = (uint64_t *)(pd[pd_idx] & ~0xFFFULL);

    pt[pt_idx] = 0;
    invlpg(virt);
}

/* -----------------------------------------------------------------------------
 * Translate virtual address to physical address
 * ----------------------------------------------------------------------------- */
uintptr_t vmm_virt_to_phys(uintptr_t virt) {
    size_t pml4_idx = (virt >> 39) & 0x1FF;
    size_t pdpt_idx = (virt >> 30) & 0x1FF;
    size_t pd_idx   = (virt >> 21) & 0x1FF;
    size_t pt_idx   = (virt >> 12) & 0x1FF;
    uintptr_t offset = virt & 0xFFF;

    if (!(kernel_pml4[pml4_idx] & PAGE_PRESENT)) return 0;
    uint64_t *pdpt = (uint64_t *)(kernel_pml4[pml4_idx] & ~0xFFFULL);

    if (!(pdpt[pdpt_idx] & PAGE_PRESENT)) return 0;
    uint64_t *pd = (uint64_t *)(pdpt[pdpt_idx] & ~0xFFFULL);

    if (pd[pd_idx] & PAGE_HUGE) {
        return (pd[pd_idx] & ~0x1FFFFFULL) | (virt & 0x1FFFFF);
    }
    if (!(pd[pd_idx] & PAGE_PRESENT)) return 0;
    uint64_t *pt = (uint64_t *)(pd[pd_idx] & ~0xFFFULL);

    if (!(pt[pt_idx] & PAGE_PRESENT)) return 0;
    return (pt[pt_idx] & ~0xFFFULL) | offset;
}
