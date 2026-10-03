package com.vhms.vhms.model;

import java.time.LocalDateTime;

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
@Document(collection = "feedback_reviews")
public class FeedbackReview {

    @Id
    private String id;

    @Indexed
    private String appointmentId;
    private String appointmentNumber;

    @Indexed
    private String petId;
    private String petName;

    @Indexed
    private String ownerId;
    private String ownerName;

    @Indexed
    private String doctorId;
    private String doctorName;

    private int rating; // 1 to 5 stars
    private String reviewComments;
    private String serviceCategory; // e.g. "Consultation", "Surgery", "Vaccination"

    @Builder.Default
    private boolean isPublished = true;

    @CreatedDate
    private LocalDateTime createdAt;
}
