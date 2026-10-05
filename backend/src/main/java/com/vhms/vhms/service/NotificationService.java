package com.vhms.vhms.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.vhms.vhms.model.NotificationLog;
import com.vhms.vhms.model.NotificationType;
import com.vhms.vhms.repository.NotificationLogRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationLogRepository notificationLogRepository;

    public NotificationLog sendNotification(
            String recipientId,
            String recipientRole,
            String recipientEmail,
            String recipientPhone,
            NotificationType type,
            String title,
            String message,
            String referenceType,
            String referenceId
    ) {
        log.info("Sending notification [{}] to {} ({}) - {}", type, recipientId, recipientRole, title);

        // Deduplication safeguard: avoid sending identical notifications within 15 seconds
        if (referenceId != null && !referenceId.isBlank()) {
            LocalDateTime cutoff = LocalDateTime.now().minusSeconds(15);
            List<NotificationLog> recents = notificationLogRepository.findByRecipientIdOrderBySentAtDesc(recipientId);
            for (NotificationLog recent : recents) {
                if (recent.getSentAt() != null && recent.getSentAt().isAfter(cutoff)
                        && type == recent.getNotificationType()
                        && referenceId.equalsIgnoreCase(recent.getReferenceId())) {
                    log.info("Duplicate notification prevented for recipient {} on ref {}", recipientId, referenceId);
                    return recent;
                }
            }
        }

        NotificationLog notification = NotificationLog.builder()
                .recipientId(recipientId)
                .recipientRole(recipientRole)
                .recipientEmail(recipientEmail)
                .recipientPhone(recipientPhone)
                .notificationType(type)
                .title(title)
                .message(message)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .isRead(false)
                .sentAt(LocalDateTime.now())
                .build();

        return notificationLogRepository.save(notification);
    }

    public List<NotificationLog> getNotificationsByRecipient(String recipientId) {
        return notificationLogRepository.findByRecipientIdOrderBySentAtDesc(recipientId);
    }

    public List<NotificationLog> getUnreadNotifications(String recipientId) {
        return notificationLogRepository.findByRecipientIdAndIsReadFalseOrderBySentAtDesc(recipientId);
    }

    public void markAsRead(String notificationId) {
        notificationLogRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationLogRepository.save(n);
        });
    }

    public long getUnreadCount(String recipientId) {
        return notificationLogRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }
}
