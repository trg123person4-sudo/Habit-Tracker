/* =============================================================================
 * mboot.h — Multiboot 1 & Multiboot 2 Specification Structures
 * =============================================================================
 * Provides C structures for extracting physical memory topology and bootloader
 * metadata across both Multiboot standards.
 * ============================================================================= */

#ifndef MYOS_MM_MBOOT_H
#define MYOS_MM_MBOOT_H

#include "types.h"

#define MULTIBOOT1_MAGIC  0x2BADB002
#define MULTIBOOT2_MAGIC  0x36D76289

#define MULTIBOOT_MEMORY_AVAILABLE        1
#define MULTIBOOT_MEMORY_RESERVED         2
#define MULTIBOOT_MEMORY_ACPI_RECLAIMABLE 3
#define MULTIBOOT_MEMORY_NVS              4
#define MULTIBOOT_MEMORY_BADRAM           5

/* -----------------------------------------------------------------------------
 * Multiboot 1 Memory Map Structures
 * ----------------------------------------------------------------------------- */
struct multiboot1_mmap_entry {
    uint32_t size;
    uint64_t addr;
    uint64_t len;
    uint32_t type;
} __attribute__((packed));
typedef struct multiboot1_mmap_entry multiboot1_mmap_entry_t;

struct multiboot1_info {
    uint32_t flags;
    uint32_t mem_lower;
    uint32_t mem_upper;
    uint32_t boot_device;
    uint32_t cmdline;
    uint32_t mods_count;
    uint32_t mods_addr;
    uint32_t syms[4];
    uint32_t mmap_length;
    uint32_t mmap_addr;
} __attribute__((packed));
typedef struct multiboot1_info multiboot1_info_t;

/* -----------------------------------------------------------------------------
 * Multiboot 2 Memory Map Structures
 * ----------------------------------------------------------------------------- */
#define MULTIBOOT2_TAG_TYPE_END   0
#define MULTIBOOT2_TAG_TYPE_MMAP  6

struct multiboot2_tag {
    uint32_t type;
    uint32_t size;
};
typedef struct multiboot2_tag multiboot2_tag_t;

struct multiboot2_mmap_entry {
    uint64_t addr;
    uint64_t len;
    uint32_t type;
    uint32_t zero;
} __attribute__((packed));
typedef struct multiboot2_mmap_entry multiboot2_mmap_entry_t;

struct multiboot2_tag_mmap {
    uint32_t type;
    uint32_t size;
    uint32_t entry_size;
    uint32_t entry_version;
    multiboot2_mmap_entry_t entries[];
};
typedef struct multiboot2_tag_mmap multiboot2_tag_mmap_t;

#endif /* MYOS_MM_MBOOT_H */
