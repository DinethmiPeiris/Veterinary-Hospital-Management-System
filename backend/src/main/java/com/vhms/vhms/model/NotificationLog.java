package com.vhms.vhms.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@Document(collection = "notification_logs")
public class NotificationLog {

    @Id
    private String id;

    @Indexed
    private String recipientId;
    private String recipientRole; // "PET_OWNER", "DOCTOR", "ADMIN"
    private String recipientEmail;
    private String recipientPhone;

    private NotificationType notificationType;
    private String title;
    private String message;

    private String referenceType; // "APPOINTMENT", "INVOICE", "PAYMENT"
    private String referenceId;

    @Builder.Default
    @JsonProperty("isRead")
    private boolean isRead = false;

    @JsonProperty("read")
    public boolean getRead() {
        return isRead;
    }

    @JsonProperty("read")
    public void setRead(boolean read) {
        this.isRead = read;
    }

    @CreatedDate
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime sentAt;

    @JsonProperty("sentAt")
    public void setSentAtFromJson(Object val) {
        if (val == null) return;
        if (val instanceof String str) {
            try {
                if (str.endsWith("Z")) {
                    this.sentAt = java.time.Instant.parse(str).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
                } else if (str.contains(".")) {
                    this.sentAt = LocalDateTime.parse(str.substring(0, str.indexOf('.')), java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                } else {
                    this.sentAt = LocalDateTime.parse(str, java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                }
            } catch (Exception e) {
                this.sentAt = LocalDateTime.now();
            }
        }
    }

    @JsonProperty("notificationType")
    public void setNotificationTypeFromJson(Object val) {
        if (val == null) return;
        String s = String.valueOf(val).toUpperCase();
        try {
            this.notificationType = NotificationType.valueOf(s);
        } catch (Exception e) {
            if (s.contains("INVOICE")) this.notificationType = NotificationType.INVOICE_GENERATED;
            else if (s.contains("PAYMENT") && s.contains("REMIND")) this.notificationType = NotificationType.PAYMENT_REMINDER;
            else if (s.contains("PAYMENT") && (s.contains("RECEIV") || s.contains("SUCCESS"))) this.notificationType = NotificationType.PAYMENT_RECEIVED;
            else if (s.contains("PAYMENT") && s.contains("FAIL")) this.notificationType = NotificationType.PAYMENT_FAILED;
            else if (s.contains("HOSPITAL") && s.contains("APPROV")) this.notificationType = NotificationType.HOSPITALIZATION_APPROVED;
            else if (s.contains("HOSPITAL") && s.contains("REJECT")) this.notificationType = NotificationType.HOSPITALIZATION_REJECTED;
            else if (s.contains("HOSPITAL")) this.notificationType = NotificationType.HOSPITALIZATION_RECOMMENDED;
            else if (s.contains("CONFIRM")) this.notificationType = NotificationType.APPOINTMENT_CONFIRMED;
            else if (s.contains("CANCEL")) this.notificationType = NotificationType.APPOINTMENT_CANCELLED;
            else if (s.contains("ASSIGN")) this.notificationType = NotificationType.APPOINTMENT_ASSIGNED;
            else if (s.contains("RESCHED")) this.notificationType = NotificationType.APPOINTMENT_RESCHEDULED;
            else if (s.contains("REQUEST")) this.notificationType = NotificationType.APPOINTMENT_REQUESTED;
            else this.notificationType = NotificationType.APPOINTMENT_REMINDER;
        }
    }

    @JsonProperty("type")
    public void setTypeFromJson(Object val) {
        if (this.notificationType == null) {
            setNotificationTypeFromJson(val);
        }
    }
}
