package com.eets.dto.request;

import jakarta.validation.constraints.*;
import java.util.List;
public record VendorRegisterRequest(
    @NotBlank @Size(max=120) String name,
    @NotBlank @Email String email,
    @NotBlank @Size(min=8, max=72) String password,
    @NotBlank @Pattern(regexp="^[6-9]\\d{9}$", message="Invalid Indian phone") String phone,
    @NotBlank @Size(max=180) String restaurantName,
    String description,
    List<String> cuisineTypes,
    String coverImageUrl,
    String logoUrl,
    @NotBlank String addressLine,
    @NotBlank String city,
    @NotBlank String state,
    @NotBlank String pincode,
    @NotNull @Min(-90) @Max(90) Double lat,
    @NotNull @Min(-180) @Max(180) Double lng,
    @NotBlank String fssaiLicense,
    String gstNumber
) {}
