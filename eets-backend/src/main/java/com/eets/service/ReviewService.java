package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.exception.*;
import com.eets.repository.*;
import com.eets.util.PageResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {
    private final ReviewRepository reviews;
    private final ReviewReplyRepository replies;
    private final OrderRepository orders;
    private final UserRepository users;
    private final RestaurantRepository restaurants;
    private final RestaurantService restaurantService;
    private final NotificationService notificationService;
    private final CacheService cacheService;
    private final ObjectMapper json = new ObjectMapper();

    public ReviewResponse create(Long userId, ReviewRequest req) {
        Order o = orders.findById(req.orderId()).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!o.getUserId().equals(userId)) throw new UnauthorizedException("Not your order");
        if (o.getStatus() != OrderStatus.DELIVERED) throw new BadRequestException("Order not delivered yet");
        if (reviews.findByOrderId(req.orderId()).isPresent()) throw new BadRequestException("Already reviewed");

        Review r = Review.builder().orderId(o.getId()).userId(userId).restaurantId(o.getRestaurantId())
            .rating(req.rating()).reviewText(req.reviewText()).images(toJson(req.images())).isVisible(true).build();
        r = reviews.save(r);
        restaurantService.recomputeRating(o.getRestaurantId());
        Restaurant rest = restaurants.findById(o.getRestaurantId()).orElse(null);
        if (rest != null) {
            cacheService.evictRestaurant(rest.getSlug());
            notificationService.send(rest.getOwnerId(), "New review", req.rating() + "★ on order " + o.getOrderNumber(), "REVIEW", r.getId());
        }
        return toDto(r);
    }

    public PageResponse<ReviewResponse> forRestaurant(Long restaurantId, int page, int size, String sort) {
        Sort s = "RATING".equalsIgnoreCase(sort) ? Sort.by(Sort.Direction.DESC, "rating") : Sort.by(Sort.Direction.DESC, "createdAt");
        return PageResponse.of(reviews.findByRestaurantIdAndIsVisibleTrue(restaurantId, PageRequest.of(page, size, s)).map(this::toDto));
    }

    public PageResponse<ReviewResponse> forVendor(Long restaurantId, int page, int size) {
        return PageResponse.of(reviews.findByRestaurantIdAndIsVisibleTrue(restaurantId,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))).map(this::toDto));
    }

    public ReviewResponse reply(Long vendorUserId, Long reviewId, String text) {
        Review review = reviews.findById(reviewId).orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        Restaurant r = restaurants.findById(review.getRestaurantId()).orElseThrow();
        if (!r.getOwnerId().equals(vendorUserId)) throw new UnauthorizedException("Not your restaurant");
        ReviewReply reply = replies.findByReviewId(reviewId).orElseGet(() ->
            ReviewReply.builder().reviewId(reviewId).vendorId(vendorUserId).build());
        reply.setReplyText(text);
        reply.setRepliedAt(Instant.now());
        replies.save(reply);
        notificationService.send(review.getUserId(), "Restaurant replied", "View their reply to your review", "REVIEW_REPLY", reviewId);
        return toDto(review);
    }

    public ReviewResponse toDto(Review r) {
        User u = users.findById(r.getUserId()).orElse(null);
        ReviewReply rep = replies.findByReviewId(r.getId()).orElse(null);
        List<String> images;
        try { images = r.getImages() == null ? List.of() : json.readValue(r.getImages(), new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){}); }
        catch (Exception e) { images = List.of(); }
        return new ReviewResponse(r.getId(), r.getUserId(), u == null ? null : u.getName(),
            u == null ? null : u.getProfileImageUrl(), r.getRating(), r.getReviewText(), images,
            r.getCreatedAt(), rep == null ? null : rep.getReplyText());
    }

    private String toJson(Object o) {
        if (o == null) return null;
        try { return json.writeValueAsString(o); } catch (Exception e) { return null; }
    }
}
