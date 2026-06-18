package com.eets.dto.request;

import com.eets.domain.AddressLabel;
import jakarta.validation.constraints.*;
public record AddressRequest(
    @NotNull AddressLabel label,
    @NotBlank String addressLine,
    @NotBlank String city,
    @NotBlank String state,
    @NotBlank @Pattern(regexp="^\\d{6}$") String pincode,
    @NotNull Double lat,
    @NotNull Double lng,
    Boolean isDefault) {}
