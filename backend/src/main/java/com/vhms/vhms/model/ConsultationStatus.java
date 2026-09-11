package com.vhms.vhms.model;

/**
 * Consultation lifecycle statuses.
 *
 * Allowed transitions:
 *   SCHEDULED    → IN_PROGRESS
 *   SCHEDULED    → CANCELLED
 *   IN_PROGRESS  → COMPLETED
 *   IN_PROGRESS  → CANCELLED
 *
 * Disallowed (terminal states cannot reverse):
 *   COMPLETED    → any
 *   CANCELLED    → any
 */
public enum ConsultationStatus {
    SCHEDULED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
