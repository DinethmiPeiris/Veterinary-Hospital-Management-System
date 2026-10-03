package com.vhms.vhms.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vhms.vhms.dto.ApiResponse;
import com.vhms.vhms.model.NotificationLog;
import com.vhms.vhms.model.NotificationType;
import com.vhms.vhms.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // US 4.2 / 4.3 / 4.4 / 4.5 / 4.11 / 4.30: Get user's notifications
    @GetMapping("/recipient/{recipientId}")
    public ResponseEntity<ApiResponse<List<NotificationLog>>> getNotifications(@PathVariable String recipientId) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getNotificationsByRecipient(recipientId)));
    }

    @GetMapping("/unread/{recipientId}")
    public ResponseEntity<ApiResponse<List<NotificationLog>>> getUnreadNotifications(@PathVariable String recipientId) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadNotifications(recipientId)));
    }

    @GetMapping("/unread-count/{recipientId}")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@PathVariable String recipientId) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadCount(recipientId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read.", null));
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<NotificationLog>> sendNotification(@RequestBody NotificationLog log) {
        NotificationLog saved = notificationService.sendNotification(
                log.getRecipientId(),
                log.getRecipientRole() != null ? log.getRecipientRole() : "PET_OWNER",
                log.getRecipientEmail(),
                log.getRecipientPhone(),
                log.getNotificationType() != null ? log.getNotificationType() : NotificationType.APPOINTMENT_REMINDER,
                log.getTitle(),
                log.getMessage(),
                log.getReferenceType(),
                log.getReferenceId()
        );
        return ResponseEntity.ok(ApiResponse.ok("Notification sent.", saved));
    }
}
