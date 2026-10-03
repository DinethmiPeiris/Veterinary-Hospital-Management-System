package com.vhms.vhms.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.vhms.vhms.dto.feedback.CreateFeedbackRequest;
import com.vhms.vhms.exception.InvalidOperationException;
import com.vhms.vhms.exception.ResourceNotFoundException;
import com.vhms.vhms.model.Appointment;
import com.vhms.vhms.model.AppointmentStatus;
import com.vhms.vhms.model.FeedbackReview;
import com.vhms.vhms.repository.AppointmentRepository;
import com.vhms.vhms.repository.FeedbackRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final AppointmentRepository appointmentRepository;

    public FeedbackReview submitFeedback(CreateFeedbackRequest request) {
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + request.getAppointmentId()));

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new InvalidOperationException("Feedback can only be submitted for COMPLETED appointments. Current status: " + appointment.getStatus());
        }

        // Check if feedback already exists for this appointment
        if (feedbackRepository.findByAppointmentId(appointment.getId()).isPresent()) {
            throw new InvalidOperationException("Feedback has already been submitted for this appointment.");
        }

        FeedbackReview feedback = FeedbackReview.builder()
                .appointmentId(appointment.getId())
                .appointmentNumber(appointment.getAppointmentNumber())
                .petId(appointment.getPetId())
                .petName(appointment.getPetName())
                .ownerId(appointment.getOwnerId())
                .ownerName(appointment.getOwnerName())
                .doctorId(appointment.getDoctorId())
                .doctorName(appointment.getDoctorName())
                .rating(request.getRating())
                .reviewComments(request.getReviewComments())
                .serviceCategory(request.getServiceCategory() != null ? request.getServiceCategory() : appointment.getAppointmentType().name())
                .isPublished(true)
                .createdAt(LocalDateTime.now())
                .build();

        return feedbackRepository.save(feedback);
    }

    public List<FeedbackReview> getAllFeedback() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<FeedbackReview> getPublishedFeedback() {
        return feedbackRepository.findByIsPublishedTrueOrderByCreatedAtDesc();
    }

    public List<FeedbackReview> getFeedbackByDoctor(String doctorId) {
        return feedbackRepository.findByDoctorIdAndIsPublishedTrue(doctorId);
    }

    public List<FeedbackReview> getFeedbackByOwner(String ownerId) {
        return feedbackRepository.findByOwnerId(ownerId);
    }

    public FeedbackReview togglePublishStatus(String feedbackId, boolean isPublished) {
        FeedbackReview feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with ID: " + feedbackId));
        feedback.setPublished(isPublished);
        return feedbackRepository.save(feedback);
    }

    public Double getDoctorAverageRating(String doctorId) {
        List<FeedbackReview> list = feedbackRepository.findByDoctorIdAndIsPublishedTrue(doctorId);
        if (list.isEmpty()) {
            return null; // No reviews yet
        }
        return list.stream().mapToInt(FeedbackReview::getRating).average().orElse(0.0);
    }
}
