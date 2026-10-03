package com.vhms.vhms.config;

import com.vhms.vhms.model.Appointment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class DataMigrationRunner implements CommandLineRunner {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Starting Appointment Number Migration...");
        List<Appointment> appointments = mongoTemplate.findAll(Appointment.class, "appointments");
        
        int seq = 1;
        
        // Find highest existing seq in new APT-XXXX format
        for (Appointment appt : appointments) {
            String num = appt.getAppointmentNumber();
            if (num != null && num.matches("APT-\\d{4,}")) {
                try {
                    int currentSeq = Integer.parseInt(num.substring(4));
                    if (currentSeq >= seq) {
                        seq = currentSeq + 1;
                    }
                } catch (Exception e) {}
            }
        }

        // Update old formats
        for (Appointment appt : appointments) {
            String num = appt.getAppointmentNumber();
            if (num != null && num.split("-").length > 2) { // Old format APT-20260909-0001
                String newNum = String.format("APT-%04d", seq++);
                appt.setAppointmentNumber(newNum);
                mongoTemplate.save(appt, "appointments");
                System.out.println("Migrated " + num + " -> " + newNum);
            }
        }
        System.out.println("Migration Complete!");
    }
}
