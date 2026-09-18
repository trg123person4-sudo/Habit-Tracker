/* =============================================================================
 * shell.h — Interactive Kernel Shell
 * =============================================================================
 * Provides an interactive command interpreter with line editing, argument
 * tokenization, and system diagnostics over both VGA console and Serial COM1.
 * ============================================================================= */

#ifndef MYOS_KERNEL_SHELL_H
#define MYOS_KERNEL_SHELL_H

#include "types.h"

#define SHELL_MAX_LINE 256
#define SHELL_MAX_ARGS 16

/* Core Shell API */
void shell_init(void);
void shell_run(void);

#endif /* MYOS_KERNEL_SHELL_H */
