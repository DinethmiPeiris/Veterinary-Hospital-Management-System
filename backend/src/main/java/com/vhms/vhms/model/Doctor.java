package com.vhms.vhms.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Document(collection = "doctors")
public class Doctor {

    @Id
    private String id;
    private String staffId;
    private String username;
    private String fullName;
    private String name;
    private String email;
    private String phone;
    private String password;
    private String specialization;
    private String availableHours = "Mon - Sun | 11:00 AM - 02:00 PM, 03:00 PM - 08:00 PM";
    private String workingDays = "Mon - Sun";
    private String photoUrl;
    private String bio;
    private String experience;
    private List<String> availableServices = Arrays.asList("OPD Consultation", "Surgery & Trauma", "Vaccination",
            "Emergency Care");
    private List<String> availableSlots = Arrays.asList("11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM",
            "01:30 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM");
    private boolean isActive = true;
    private String role = "DOCTOR";
    private LocalDateTime createdAt = LocalDateTime.now();

    public Doctor() {
    }

    public Doctor(String staffId, String fullName, String email, String phone, String password, String specialization) {
        this.staffId = staffId;
        this.username = email != null && email.contains("@") ? email.split("@")[0] : email;
        this.fullName = fullName;
        this.name = fullName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.specialization = specialization;
        this.availableHours = "Mon - Sun | 11:00 AM - 02:00 PM, 03:00 PM - 08:00 PM";
        this.workingDays = "Mon - Sun";
        this.availableServices = Arrays.asList("OPD Consultation", "Surgery & Trauma", "Vaccination", "Emergency Care");
        this.availableSlots = Arrays.asList("11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
                "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM");
        this.isActive = true;
        this.role = "DOCTOR";
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStaffId() {
        return staffId;
    }

    public void setStaffId(String staffId) {
        this.staffId = staffId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName != null ? fullName : name;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
        if (this.name == null)
            this.name = fullName;
    }

    public String getName() {
        return name != null ? name : fullName;
    }

    public void setName(String name) {
        this.name = name;
        if (this.fullName == null)
            this.fullName = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getAvailableHours() {
        return availableHours;
    }

    public void setAvailableHours(String availableHours) {
        this.availableHours = availableHours;
    }

    public String getWorkingDays() {
        return workingDays;
    }

    public void setWorkingDays(String workingDays) {
        this.workingDays = workingDays;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public List<String> getAvailableServices() {
        return availableServices;
    }

    public void setAvailableServices(List<String> availableServices) {
        this.availableServices = availableServices;
    }

    public List<String> getAvailableSlots() {
        return availableSlots;
    }

    public void setAvailableSlots(List<String> availableSlots) {
        this.availableSlots = availableSlots;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
