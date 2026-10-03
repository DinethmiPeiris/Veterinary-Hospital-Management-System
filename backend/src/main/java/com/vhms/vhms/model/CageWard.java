package com.vhms.vhms.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "cages_wards")
public class CageWard {

    @Id
    private String id;
    private String code;
    // Types: SMALL_PET, LARGE_PET, ICU, ISOLATION
    private String type;
    // Statuses: AVAILABLE, OCCUPIED, MAINTENANCE
    private String status;
    private String notes;
}
