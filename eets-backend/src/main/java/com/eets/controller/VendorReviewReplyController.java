package com.eets.controller;

import com.eets.dto.request.ReviewReplyRequest;
import com.eets.dto.response.ReviewResponse;
import com.eets.security.CurrentUser;
import com.eets.service.ReviewService;
import com.eets.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vendor/reviews")
@RequiredArgsConstructor
public class VendorReviewReplyController {
    private final ReviewService reviews;
    @PostMapping("/{id}/reply")
    public ApiResponse<ReviewResponse> reply(@PathVariable Long id, @Valid @RequestBody ReviewReplyRequest req) {
        return ApiResponse.ok(reviews.reply(CurrentUser.id(), id, req.replyText()));
    }
}
