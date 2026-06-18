package com.eets.dto.request;

import com.eets.domain.VehicleType;
import jakarta.validation.constraints.*;
public record DriverRegisterRequest(
    @NotBlank @Size(max=120) String name,
    @NotBlank @Pattern(regexp="^[6-9]\\d{9}$", message="Invalid Indian phone") String phone,
    @NotBlank @Email String email,
    @NotBlank String dob,
    @NotNull VehicleType vehicleType,
    String vehicleMake,
    String vehicleModel,
    @NotBlank @Size(max=30) String vehicleRegNumber,
    String aadhaarFrontUrl,
    String aadhaarBackUrl,
    @NotBlank String licenseUrl,
    String rcUrl,
    String selfieUrl,
    @NotBlank String bankAccountNumber,
    @NotBlank String bankIfsc,
    String upiId
) {}
