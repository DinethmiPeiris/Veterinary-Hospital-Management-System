package com.vhms.vhms.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
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
}
