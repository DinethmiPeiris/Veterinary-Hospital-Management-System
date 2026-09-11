package com.vhms.vhms.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/**
 * Centralised exception handling for all REST controllers.
 * Returns a consistent JSON error body:
 * {
 *   "timestamp": "...",
 *   "status": 404,
 *   "error": "Not Found",
 *   "message": "...",
 *   "path": "/api/v1/..."
 * }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── 404 — Resource Not Found ────────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(
            ResourceNotFoundException ex, WebRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    // ── 400 — Invalid Status Transition ─────────────────────────────
    @ExceptionHandler(InvalidStatusTransitionException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidStatusTransition(
            InvalidStatusTransitionException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // ── 400 — Bean Validation Errors ────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex, WebRequest request) {

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage()));

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation Failed");
        body.put("message", "One or more fields are invalid");
        body.put("fieldErrors", fieldErrors);
        body.put("path", request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    // ── 400 — Generic IllegalArgumentException ──────────────────────
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // ── 404 — No Static Resource Found ──────────────────────────────
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFoundException(
            org.springframework.web.servlet.resource.NoResourceFoundException ex, WebRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    // ── 500 — Catch-all ─────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex, WebRequest request) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred: " + ex.getMessage(), request);
    }

    // ── Helper ──────────────────────────────────────────────────────
    private ResponseEntity<Map<String, Object>> buildResponse(
            HttpStatus status, String message, WebRequest request) {

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(body, status);
    }
}
