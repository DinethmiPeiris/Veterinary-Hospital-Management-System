package com.vhms.vhms.dto.billing;

import java.util.ArrayList;
import java.util.List;

import com.vhms.vhms.model.InvoiceItem;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddDoctorServiceChargeRequest {

    @NotEmpty(message = "Service charges cannot be empty")
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();
}
