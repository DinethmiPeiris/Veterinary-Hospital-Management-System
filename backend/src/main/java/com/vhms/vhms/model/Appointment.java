package com.vhms.vhms.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "appointments")
public class Appointment {

    @Id
    private String id;
    private String petOwnerId;
    private String petOwnerName;
    private String ownerName;
    private String petOwnerEmail;
    private String petOwnerPhone;

    private String petId;
    private String petName;
    private String species;
    private String breed;
    private Object age;
    private Object weight;
    private String gender;
    private String photoUrl;

    private String doctorId;
    private String doctorName;
    private String doctorEmail;
    private String specialization;

    private String date;
    private Object appointmentDate;
    private String timeSlot;
    private String time;
    private String reason;
    private String status; // PENDING, APPROVED, REJECTED, COMPLETED, IN_PROGRESS
    private String doctorNotes;
    private String prescriptions;
    private String diagnosis;

    private LocalDateTime createdAt;

    public Appointment() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPetOwnerId() {
        return petOwnerId;
    }

    public void setPetOwnerId(String petOwnerId) {
        this.petOwnerId = petOwnerId;
    }

    public String getPetOwnerName() {
        return petOwnerName != null ? petOwnerName : ownerName;
    }

    public void setPetOwnerName(String petOwnerName) {
        this.petOwnerName = petOwnerName;
        if (this.ownerName == null)
            this.ownerName = petOwnerName;
    }

    public String getOwnerName() {
        return ownerName != null ? ownerName : petOwnerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
        if (this.petOwnerName == null)
            this.petOwnerName = ownerName;
    }

    public String getPetOwnerEmail() {
        return petOwnerEmail;
    }

    public void setPetOwnerEmail(String petOwnerEmail) {
        this.petOwnerEmail = petOwnerEmail;
    }

    public String getPetOwnerPhone() {
        return petOwnerPhone;
    }

    public void setPetOwnerPhone(String petOwnerPhone) {
        this.petOwnerPhone = petOwnerPhone;
    }

    public String getPetId() {
        return petId;
    }

    public void setPetId(String petId) {
        this.petId = petId;
    }

    public String getPetName() {
        return petName;
    }

    public void setPetName(String petName) {
        this.petName = petName;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public String getAge() {
        return age != null ? String.valueOf(age) : null;
    }

    public void setAge(Object age) {
        this.age = age;
    }

    public String getWeight() {
        return weight != null ? String.valueOf(weight) : null;
    }

    public void setWeight(Object weight) {
        this.weight = weight;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getDoctorEmail() {
        return doctorEmail;
    }

    public void setDoctorEmail(String doctorEmail) {
        this.doctorEmail = doctorEmail;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getDate() {
        if (date != null)
            return date;
        if (appointmentDate != null)
            return String.valueOf(appointmentDate);
        return null;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public Object getAppointmentDate() {
        return appointmentDate != null ? appointmentDate : date;
    }

    public void setAppointmentDate(Object appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public String getTimeSlot() {
        return timeSlot != null ? timeSlot : time;
    }

    public void setTimeSlot(String timeSlot) {
        this.timeSlot = timeSlot;
        if (this.time == null)
            this.time = timeSlot;
    }

    public String getTime() {
        return time != null ? time : timeSlot;
    }

    public void setTime(String time) {
        this.time = time;
        if (this.timeSlot == null)
            this.timeSlot = time;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }

    public String getPrescriptions() {
        return prescriptions;
    }

    public void setPrescriptions(String prescriptions) {
        this.prescriptions = prescriptions;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
