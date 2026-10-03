package com.vhms.vhms.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
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
import com.vhms.vhms.dto.feedback.CreateFeedbackRequest;
import com.vhms.vhms.model.FeedbackReview;
import com.vhms.vhms.service.FeedbackService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    // US 4.12: Pet owner submit feedback
    @PostMapping
    public ResponseEntity<ApiResponse<FeedbackReview>> submitFeedback(@Valid @RequestBody CreateFeedbackRequest request) {
        FeedbackReview created = feedbackService.submitFeedback(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thank you! Your feedback has been submitted.", created));
    }

    // Public / Published feedback
    @GetMapping
    public ResponseEntity<ApiResponse<List<FeedbackReview>>> getPublishedFeedback() {
        return ResponseEntity.ok(ApiResponse.ok(feedbackService.getPublishedFeedback()));
    }

    // US 4.26: Admin view all feedback
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<FeedbackReview>>> getAllFeedback() {
        return ResponseEntity.ok(ApiResponse.ok(feedbackService.getAllFeedback()));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<FeedbackReview>>> getFeedbackByDoctor(@PathVariable String doctorId) {
        return ResponseEntity.ok(ApiResponse.ok(feedbackService.getFeedbackByDoctor(doctorId)));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<FeedbackReview>>> getFeedbackByOwner(@PathVariable String ownerId) {
        return ResponseEntity.ok(ApiResponse.ok(feedbackService.getFeedbackByOwner(ownerId)));
    }

    // US 4.26: Admin toggle publish status
    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<FeedbackReview>> togglePublish(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> payload) {
        boolean isPublished = payload != null && payload.getOrDefault("isPublished", true);
        FeedbackReview updated = feedbackService.togglePublishStatus(id, isPublished);
        return ResponseEntity.ok(ApiResponse.ok("Feedback publish status updated.", updated));
    }
}
