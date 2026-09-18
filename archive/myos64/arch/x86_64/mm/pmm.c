/* =============================================================================
 * pmm.c — Physical Memory Manager (Bitmap Frame Allocator)
 * =============================================================================
 * Discovers physical memory from Multiboot 1/2 maps, tracks frame availability
 * in a bit array, and manages 4 KiB frame allocations.
 * ============================================================================= */

#include "pmm.h"
#include "mboot.h"

extern uint8_t _kernel_start;
extern uint8_t _kernel_end;

static uint8_t *pmm_bitmap = 0;
static size_t total_frames = 0;
static size_t used_frames  = 0;
static size_t max_ram_bytes = 0;

/* -----------------------------------------------------------------------------
 * Bitmap bit-manipulation primitives
 * ----------------------------------------------------------------------------- */
static inline void pmm_set_bit(size_t frame) {
    pmm_bitmap[frame / 8] |= (1 << (frame % 8));
}

static inline void pmm_clear_bit(size_t frame) {
    pmm_bitmap[frame / 8] &= ~(1 << (frame % 8));
}

static inline bool pmm_test_bit(size_t frame) {
    return (pmm_bitmap[frame / 8] & (1 << (frame % 8))) != 0;
}

/* -----------------------------------------------------------------------------
 * Mark a physical memory region as Available (0 in bitmap)
 * ----------------------------------------------------------------------------- */
static void pmm_init_region(uintptr_t base, size_t size) {
    size_t start_frame = base / PAGE_SIZE;
    size_t frame_count = size / PAGE_SIZE;

    for (size_t i = 0; i < frame_count; i++) {
        if (start_frame + i < total_frames) {
            pmm_clear_bit(start_frame + i);
            if (used_frames > 0) used_frames--;
        }
    }
}

/* -----------------------------------------------------------------------------
 * Mark a physical memory region as Reserved / Used (1 in bitmap)
 * ----------------------------------------------------------------------------- */
static void pmm_deinit_region(uintptr_t base, size_t size) {
    size_t start_frame = base / PAGE_SIZE;
    size_t frame_count = (size + PAGE_SIZE - 1) / PAGE_SIZE;

    for (size_t i = 0; i < frame_count; i++) {
        if (start_frame + i < total_frames) {
            if (!pmm_test_bit(start_frame + i)) {
                pmm_set_bit(start_frame + i);
                used_frames++;
            }
        }
    }
}

/* -----------------------------------------------------------------------------
 * Initialize Physical Memory Manager from Multiboot information
 * ----------------------------------------------------------------------------- */
void pmm_init(uint64_t magic, uint64_t mboot_addr) {
    /* Default memory assumption if bootloader doesn't report: 128 MiB */
    max_ram_bytes = 128 * 1024 * 1024;

    /* Scan Multiboot memory map to find highest usable physical memory address */
    if (magic == MULTIBOOT1_MAGIC && mboot_addr != 0) {
        multiboot1_info_t *mbi = (multiboot1_info_t *)mboot_addr;
        if (mbi->flags & (1 << 6)) { /* mmap_* fields are valid */
            uintptr_t mmap_cur = mbi->mmap_addr;
            uintptr_t mmap_end = mbi->mmap_addr + mbi->mmap_length;

            while (mmap_cur < mmap_end) {
                multiboot1_mmap_entry_t *entry = (multiboot1_mmap_entry_t *)mmap_cur;
                if (entry->type == MULTIBOOT_MEMORY_AVAILABLE) {
                    uint64_t entry_end = entry->addr + entry->len;
                    if (entry_end > max_ram_bytes) {
                        max_ram_bytes = entry_end;
                    }
                }
                mmap_cur += entry->size + sizeof(entry->size);
            }
        }
    } else if (magic == MULTIBOOT2_MAGIC && mboot_addr != 0) {
        uint8_t *tag_ptr = (uint8_t *)(mboot_addr + 8);
        while (1) {
            multiboot2_tag_t *tag = (multiboot2_tag_t *)tag_ptr;
            if (tag->type == MULTIBOOT2_TAG_TYPE_END) break;

            if (tag->type == MULTIBOOT2_TAG_TYPE_MMAP) {
                multiboot2_tag_mmap_t *mmap = (multiboot2_tag_mmap_t *)tag;
                size_t num_entries = (tag->size - sizeof(multiboot2_tag_mmap_t)) / mmap->entry_size;

                for (size_t i = 0; i < num_entries; i++) {
                    multiboot2_mmap_entry_t *entry = (multiboot2_mmap_entry_t *)((uintptr_t)mmap->entries + i * mmap->entry_size);
                    if (entry->type == MULTIBOOT_MEMORY_AVAILABLE) {
                        uint64_t entry_end = entry->addr + entry->len;
                        if (entry_end > max_ram_bytes) {
                            max_ram_bytes = entry_end;
                        }
                    }
                }
                break;
            }
            tag_ptr += (tag->size + 7) & ~7;
        }
    }

    /* Cap at 4 GiB for early physical frame tracking */
    if (max_ram_bytes > 0x100000000ULL) {
        max_ram_bytes = 0x100000000ULL;
    }

    total_frames = max_ram_bytes / PAGE_SIZE;
    used_frames  = total_frames;

    /* Place bitmap immediately after the kernel image */
    pmm_bitmap = (uint8_t *)&_kernel_end;
    size_t bitmap_bytes = total_frames / 8;

    /* Mark all frames as used initially */
    for (size_t i = 0; i < bitmap_bytes; i++) {
        pmm_bitmap[i] = 0xFF;
    }

    /* Free all available RAM segments detected in memory map */
    if (magic == MULTIBOOT1_MAGIC && mboot_addr != 0) {
        multiboot1_info_t *mbi = (multiboot1_info_t *)mboot_addr;
        if (mbi->flags & (1 << 6)) {
            uintptr_t mmap_cur = mbi->mmap_addr;
            uintptr_t mmap_end = mbi->mmap_addr + mbi->mmap_length;
            while (mmap_cur < mmap_end) {
                multiboot1_mmap_entry_t *entry = (multiboot1_mmap_entry_t *)mmap_cur;
                if (entry->type == MULTIBOOT_MEMORY_AVAILABLE) {
                    pmm_init_region((uintptr_t)entry->addr, (size_t)entry->len);
                }
                mmap_cur += entry->size + sizeof(entry->size);
            }
        }
    } else if (magic == MULTIBOOT2_MAGIC && mboot_addr != 0) {
        uint8_t *tag_ptr = (uint8_t *)(mboot_addr + 8);
        while (1) {
            multiboot2_tag_t *tag = (multiboot2_tag_t *)tag_ptr;
            if (tag->type == MULTIBOOT2_TAG_TYPE_END) break;

            if (tag->type == MULTIBOOT2_TAG_TYPE_MMAP) {
                multiboot2_tag_mmap_t *mmap = (multiboot2_tag_mmap_t *)tag;
                size_t num_entries = (tag->size - sizeof(multiboot2_tag_mmap_t)) / mmap->entry_size;
                for (size_t i = 0; i < num_entries; i++) {
                    multiboot2_mmap_entry_t *entry = (multiboot2_mmap_entry_t *)((uintptr_t)mmap->entries + i * mmap->entry_size);
                    if (entry->type == MULTIBOOT_MEMORY_AVAILABLE) {
                        pmm_init_region((uintptr_t)entry->addr, (size_t)entry->len);
                    }
                }
                break;
            }
            tag_ptr += (tag->size + 7) & ~7;
        }
    } else {
        /* Fallback: free 1 MiB to max_ram_bytes */
        pmm_init_region(0x100000, max_ram_bytes - 0x100000);
    }

    /* -------------------------------------------------------------------------
     * Protect Critical System Regions from Frame Allocations
     * ------------------------------------------------------------------------- */
    /* 1. Reserve Low 1 MiB (BIOS IVT, BDA, VGA Buffer at 0xB8000) */
    pmm_deinit_region(0x00000000, 0x100000);

    /* 2. Reserve Kernel Executable and Static Data */
    uintptr_t k_start = (uintptr_t)&_kernel_start;
    uintptr_t k_end   = (uintptr_t)&_kernel_end;
    pmm_deinit_region(k_start, k_end - k_start);

    /* 3. Reserve PMM Bitmap Memory Range */
    pmm_deinit_region((uintptr_t)pmm_bitmap, bitmap_bytes);

    /* 4. Reserve Multiboot Data Structure */
    if (mboot_addr != 0) {
        pmm_deinit_region(mboot_addr, 4096);
    }
}

/* -----------------------------------------------------------------------------
 * Allocate a single 4 KiB physical page frame
 * Returns physical base address of frame, or 0 if out of memory.
 * ----------------------------------------------------------------------------- */
uintptr_t pmm_alloc_frame(void) {
    size_t bitmap_bytes = total_frames / 8;

    for (size_t byte_idx = 0; byte_idx < bitmap_bytes; byte_idx++) {
        if (pmm_bitmap[byte_idx] != 0xFF) {
            /* Found byte with at least one free bit (0) */
            for (int bit_idx = 0; bit_idx < 8; bit_idx++) {
                if (!(pmm_bitmap[byte_idx] & (1 << bit_idx))) {
                    size_t frame = byte_idx * 8 + bit_idx;
                    pmm_set_bit(frame);
                    used_frames++;
                    return (uintptr_t)(frame * PAGE_SIZE);
                }
            }
        }
    }
    return 0; /* Out of physical memory */
}

/* -----------------------------------------------------------------------------
 * Deallocate a 4 KiB physical page frame
 * ----------------------------------------------------------------------------- */
void pmm_free_frame(uintptr_t phys_addr) {
    size_t frame = phys_addr / PAGE_SIZE;
    if (frame < total_frames && pmm_test_bit(frame)) {
        pmm_clear_bit(frame);
        if (used_frames > 0) used_frames--;
    }
}

/* -----------------------------------------------------------------------------
 * Memory Statistics Telemetry
 * ----------------------------------------------------------------------------- */
size_t pmm_get_total_memory(void) {
    return total_frames * PAGE_SIZE;
}

size_t pmm_get_used_memory(void) {
    return used_frames * PAGE_SIZE;
}

size_t pmm_get_free_memory(void) {
    return (total_frames - used_frames) * PAGE_SIZE;
}
