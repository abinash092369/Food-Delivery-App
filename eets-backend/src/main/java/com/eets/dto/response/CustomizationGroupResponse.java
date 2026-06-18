package com.eets.dto.response;

import com.eets.domain.CustomizationType;
import java.util.List;
public record CustomizationGroupResponse(Long id, String name, CustomizationType type,
    Boolean isRequired, List<CustomizationOptionResponse> options) {}
