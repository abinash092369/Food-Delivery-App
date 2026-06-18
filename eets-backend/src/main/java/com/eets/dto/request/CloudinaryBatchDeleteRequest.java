package com.eets.dto.request;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/** Request body for the batch-delete endpoint. */
public record CloudinaryBatchDeleteRequest(@NotEmpty List<String> publicIds) {}
