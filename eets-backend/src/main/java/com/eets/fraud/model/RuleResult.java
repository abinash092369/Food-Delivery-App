package com.eets.fraud.model;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class RuleResult {
    private boolean flagged;
    private Long userId;
    private Long orderId;
    private String flagType;
    private int riskScore;
    private Map<String, Object> details;
}
