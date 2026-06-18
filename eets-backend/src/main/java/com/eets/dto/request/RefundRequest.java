package com.eets.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record RefundRequest(@NotNull BigDecimal amount, @NotBlank String reason) {}
