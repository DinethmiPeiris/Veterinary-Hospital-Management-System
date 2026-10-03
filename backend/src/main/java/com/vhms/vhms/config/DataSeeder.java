package com.vhms.vhms.config;

import com.vhms.vhms.model.Doctor;
import com.vhms.vhms.model.User;
import com.vhms.vhms.repository.DoctorRepository;
import com.vhms.vhms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private DoctorRepository doctorRepository;

        @Override
        public void run(String... args) throws Exception {
                // Seed Default System Admin if empty
                if (userRepository.count() == 0) {
                        User admin = new User("System Administrator", "admin@vhms.com", "0770000000", "Colombo",
                                        "admin123",
                                        "ADMIN", "ACTIVE");
                        userRepository.save(admin);
                }

                // Seed Default Doctors if empty
                if (doctorRepository.count() == 0) {
                        Doctor d1 = new Doctor(
                                        "DOC-1001",
                                        "Dr. Sirimath Channa Molligoda",
                                        "channa@vhms.com",
                                        "0771122334",
                                        "doc123",
                                        "Veterinary Surgeon & OPD Specialist");
                        doctorRepository.save(d1);

                        Doctor d2 = new Doctor(
                                        "DOC-1002",
                                        "Dr. Anura Perera",
                                        "anura@vhms.com",
                                        "0775566778",
                                        "doc123",
                                        "Senior Veterinary Surgeon & Medicine Specialist");
                        doctorRepository.save(d2);
                }
        }
}
