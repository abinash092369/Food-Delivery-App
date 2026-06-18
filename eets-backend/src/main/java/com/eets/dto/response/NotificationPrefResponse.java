package com.eets.dto.response;

public record NotificationPrefResponse(Boolean push, Boolean email, Boolean sms,
    Boolean orderUpdates, Boolean promotions) {}
