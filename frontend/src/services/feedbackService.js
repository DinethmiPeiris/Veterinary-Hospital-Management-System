import API_BASE_URL from './apiConfig';

export const feedbackService = {
  // Submit feedback (Pet Owner - US 4.12)
  async submitFeedback(data) {
    const res = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Get published reviews (Public / Pet Owner)
  async getPublishedFeedback() {
    const res = await fetch(`${API_BASE_URL}/feedback`);
    return res.json();
  },

  // Get all reviews (Admin - US 4.26)
  async getAllFeedback() {
    const res = await fetch(`${API_BASE_URL}/feedback/all`);
    return res.json();
  },

  // Get reviews by doctor
  async getFeedbackByDoctor(doctorId) {
    const res = await fetch(`${API_BASE_URL}/feedback/doctor/${doctorId}`);
    return res.json();
  },

  // Get reviews by owner
  async getFeedbackByOwner(ownerId) {
    const res = await fetch(`${API_BASE_URL}/feedback/owner/${ownerId}`);
    return res.json();
  },

  // Toggle publish status (Admin - US 4.26)
  async togglePublish(feedbackId, isPublished) {
    const res = await fetch(`${API_BASE_URL}/feedback/${feedbackId}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished }),
    });
    return res.json();
  },
};
