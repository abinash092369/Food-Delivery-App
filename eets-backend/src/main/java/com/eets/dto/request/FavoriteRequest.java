package com.eets.dto.request;

import com.eets.domain.FavoriteType;
import jakarta.validation.constraints.*;
public record FavoriteRequest(@NotNull FavoriteType type, @NotNull Long referenceId) {}
