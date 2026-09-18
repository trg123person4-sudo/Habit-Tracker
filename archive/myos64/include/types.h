/* =============================================================================
 * types.h — Freestanding Primitive Type Definitions
 * =============================================================================
 * Provides fixed-width integer types and basic utility primitives without
 * requiring the host C standard library.
 * ============================================================================= */

#ifndef MYOS_TYPES_H
#define MYOS_TYPES_H

/* Exact-width integer types */
typedef unsigned char      uint8_t;
typedef unsigned short     uint16_t;
typedef unsigned int       uint32_t;
typedef unsigned long long uint64_t;

typedef signed char        int8_t;
typedef signed short       int16_t;
typedef signed int         int32_t;
typedef signed long long   int64_t;

/* Pointer-sized integers */
typedef uint64_t           uintptr_t;
typedef int64_t            intptr_t;
typedef uint64_t           size_t;
typedef int64_t            ssize_t;

/* Boolean type */
#define bool  _Bool
#define true  1
#define false 0

/* Standard null pointer */
#ifndef NULL
#define NULL ((void *)0)
#endif

#endif /* MYOS_TYPES_H */
