package com.vhms.vhms.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendPasswordResetEmail(String toEmail, String recipientName, String resetCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Sri Jayawardanapura Animal Hospital");
            helper.setTo(toEmail);
            helper.setSubject("Your Password Reset Code - VHMS");

            String htmlBody =
                "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><title>Password Reset</title></head>" +
                "<body style=\"margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;\">" +
                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#f0f4f8;padding:40px 0;\">" +
                "<tr><td align=\"center\">" +
                "<table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);\">" +
                "<tr><td style=\"background:linear-gradient(135deg,#1a7a5e 0%,#0d5c44 100%);padding:36px 40px;text-align:center;\">" +
                "<div style=\"font-size:2.5rem;margin-bottom:8px;\">&#128062;</div>" +
                "<h1 style=\"color:#ffffff;margin:0;font-size:1.4rem;font-weight:700;\">Sri Jayawardanapura Animal Hospital</h1>" +
                "<p style=\"color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:0.9rem;\">Veterinary Hospital Management System</p>" +
                "</td></tr>" +
                "<tr><td style=\"padding:40px 40px 32px;\">" +
                "<p style=\"color:#374151;font-size:1rem;margin:0 0 8px;\">Hello, <strong>" + recipientName + "</strong></p>" +
                "<p style=\"color:#6b7280;font-size:0.95rem;margin:0 0 32px;line-height:1.6;\">We received a request to reset your VHMS account password. Use the code below to proceed.</p>" +
                "<div style=\"background:#f0fdf4;border:2px dashed #1a7a5e;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;\">" +
                "<p style=\"color:#6b7280;font-size:0.8rem;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;\">Your Reset Code</p>" +
                "<div style=\"font-size:2.8rem;font-weight:800;letter-spacing:12px;color:#1a7a5e;font-family:'Courier New',monospace;\">" + resetCode + "</div>" +
                "<p style=\"color:#ef4444;font-size:0.82rem;margin:14px 0 0;\">&#9200; Expires in <strong>15 minutes</strong></p>" +
                "</div>" +
                "<p style=\"color:#6b7280;font-size:0.88rem;line-height:1.6;margin:0;\">Enter this code in the Reset Password form on the login page. If you did not request a password reset, please ignore this email.</p>" +
                "</td></tr>" +
                "<tr><td style=\"background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;\">" +
                "<p style=\"color:#9ca3af;font-size:0.8rem;margin:0;\">&#169; 2025 Sri Jayawardanapura Animal Hospital &nbsp;|&nbsp; 0112 888 291</p>" +
                "<p style=\"color:#d1d5db;font-size:0.75rem;margin:6px 0 0;\">This is an automated message. Please do not reply.</p>" +
                "</td></tr></table></td></tr></table></body></html>";

            helper.setText(htmlBody, true);
            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Failed to send password reset email. Please try again later.", e);
        }
    }
}