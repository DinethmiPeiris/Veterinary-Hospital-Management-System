package com.vhms.vhms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.vhms.vhms.model.Consultation;
import com.vhms.vhms.model.ConsultationStatus;

@Repository
public interface ConsultationRepository extends MongoRepository<Consultation, String> {

    /** Medical history — all consultations for a pet, newest first. */
    List<Consultation> findByPetIdOrderByConsultationDateDesc(String petId);

    /** Doctor's consultation list. */
    List<Consultation> findByDoctorIdOrderByConsultationDateDesc(String doctorId);

    /** Link to a specific appointment. */
    Optional<Consultation> findByAppointmentId(String appointmentId);

    /** All consultations tied to an EMR. */
    List<Consultation> findByMedicalRecordIdOrderByConsultationDateDesc(String medicalRecordId);

    /** Filter by status. */
    List<Consultation> findByStatus(ConsultationStatus status);

    /** Check if a consultation already exists for an appointment. */
    boolean existsByAppointmentId(String appointmentId);
}
