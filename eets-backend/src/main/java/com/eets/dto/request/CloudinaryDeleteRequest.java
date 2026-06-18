package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/** Request body for the delete-image endpoint. */
public record CloudinaryDeleteRequest(@NotBlank String publicId) {}
