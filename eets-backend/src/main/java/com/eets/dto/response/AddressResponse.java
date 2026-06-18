package com.eets.dto.response;

import com.eets.domain.AddressLabel;
public record AddressResponse(Long id, AddressLabel label, String addressLine, String city,
    String state, String pincode, Double lat, Double lng, Boolean isDefault) {}
