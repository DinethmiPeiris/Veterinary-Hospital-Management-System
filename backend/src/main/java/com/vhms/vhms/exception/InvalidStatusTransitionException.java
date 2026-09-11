package com.vhms.vhms.exception;

import com.vhms.vhms.model.ConsultationStatus;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an illegal consultation status transition is attempted.
 *
 * Valid transitions:
 *   SCHEDULED    → IN_PROGRESS | CANCELLED
 *   IN_PROGRESS  → COMPLETED   | CANCELLED
 *
 * Terminal states (COMPLETED, CANCELLED) cannot transition to anything.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidStatusTransitionException extends RuntimeException {

    public InvalidStatusTransitionException(ConsultationStatus from, ConsultationStatus to) {
        super(String.format("Invalid status transition from %s to %s", from, to));
    }

    public InvalidStatusTransitionException(String message) {
        super(message);
    }
}
