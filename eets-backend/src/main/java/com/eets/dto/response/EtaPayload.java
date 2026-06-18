package com.eets.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtaPayload {
    private Long orderId;
    private int etaMinutes;
    private LocalDateTime estimatedDeliveryAt;
}
