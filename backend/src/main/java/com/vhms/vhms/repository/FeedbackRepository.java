package com.vhms.vhms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.vhms.vhms.model.FeedbackReview;

@Repository
public interface FeedbackRepository extends MongoRepository<FeedbackReview, String> {

    Optional<FeedbackReview> findByAppointmentId(String appointmentId);

    List<FeedbackReview> findByDoctorId(String doctorId);

    List<FeedbackReview> findByDoctorIdAndIsPublishedTrue(String doctorId);

    List<FeedbackReview> findByOwnerId(String ownerId);

    List<FeedbackReview> findByIsPublishedTrueOrderByCreatedAtDesc();

    List<FeedbackReview> findAllByOrderByCreatedAtDesc();
}
