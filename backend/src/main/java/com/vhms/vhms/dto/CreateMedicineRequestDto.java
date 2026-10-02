package com.vhms.vhms.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMedicineRequestDto {

    @NotBlank(message = "Hospitalization ID is required.")
    private String hospitalizationId;

    @NotBlank(message = "Inventory Item ID is required.")
    private String inventoryItemId;

    @NotNull(message = "Requested quantity is required.")
    @Min(value = 1, message = "Requested quantity must be at least 1.")
    private Integer requestedQuantity;

    private String instructions;
    private String doctorId;
    private String doctorName;
}
