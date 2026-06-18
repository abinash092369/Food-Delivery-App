package com.eets.controller;

import com.eets.dto.request.*;
import com.eets.dto.response.ReviewResponse;
import com.eets.security.CurrentUser;
import com.eets.service.ReviewService;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviews;

    @PostMapping
    public ApiResponse<ReviewResponse> create(@Valid @RequestBody ReviewRequest req) {
        return ApiResponse.ok(reviews.create(CurrentUser.id(), req));
    }
    @GetMapping("/restaurant/{restaurantId}")
    public ApiResponse<PageResponse<ReviewResponse>> forRestaurant(@PathVariable Long restaurantId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "RECENT") String sort) {
        return ApiResponse.ok(reviews.forRestaurant(restaurantId, page, size, sort));
    }
}
