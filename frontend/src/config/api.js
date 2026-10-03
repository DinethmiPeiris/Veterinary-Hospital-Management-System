/**
 * Centralized API configuration.
 * All frontend files should import API_BASE from here
 * so that changing the backend URL only requires one edit.
 */

export const API_BASE_URL = 'http://localhost:8081';

/** Convenience helper – returns a full URL for a given path */
export const apiUrl = (path) => `${API_BASE_URL}${path}`;

/** Pre-encoded Basic Auth header for the admin user (admin:admin) */
export const ADMIN_AUTH_HEADER = {
    Authorization: 'Basic YWRtaW46YWRtaW4=', // admin:admin
};
