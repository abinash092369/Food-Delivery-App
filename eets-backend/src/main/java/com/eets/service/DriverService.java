package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.exception.*;
import com.eets.repository.*;
import com.eets.util.DateUtil;
import com.eets.util.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DriverService {
    private final UserRepository users;
    private final DeliveryPartnerRepository drivers;
    private final DeliveryAssignmentRepository assignments;
    private final OrderRepository orders;
    private final PasswordEncoder encoder;
    private final DeliveryService deliveryService;
    private final org.springframework.data.redis.core.StringRedisTemplate redis;
    private final com.eets.security.JwtTokenProvider jwt;

    public Map<String, Object> register(DriverRegisterRequest req) {
        User u = users.findByPhone(req.phone()).orElseGet(() ->
            users.save(User.builder().name(req.name()).phone(req.phone())
                .email(req.email() == null ? req.phone() + "@driver.eets.local" : req.email())
                .passwordHash(encoder.encode(req.phone())).role(Role.DRIVER).isActive(true).build()));
        if (u.getRole() == Role.CUSTOMER) {
            u.setRole(Role.DRIVER);
            users.save(u);
        } else if (u.getRole() != Role.DRIVER) {
            throw new BadRequestException("Phone already used by another role");
        }
        DeliveryPartner d = drivers.findByUserId(u.getId()).orElseGet(() -> DeliveryPartner.builder().userId(u.getId()).build());
        d.setVehicleType(req.vehicleType());
        d.setVehicleMake(req.vehicleMake()); d.setVehicleModel(req.vehicleModel());
        d.setVehicleRegNumber(req.vehicleRegNumber());
        d.setAadhaarFrontUrl(req.aadhaarFrontUrl()); d.setAadhaarBackUrl(req.aadhaarBackUrl());
        d.setLicenseUrl(req.licenseUrl()); d.setRcUrl(req.rcUrl()); d.setSelfieUrl(req.selfieUrl());
        d.setBankAccountNumber(req.bankAccountNumber()); d.setBankIfsc(req.bankIfsc()); d.setUpiId(req.upiId());
        d.setIsVerified(false);
        d = drivers.save(d);
        String token = jwt.generateAccessToken(u.getId(), u.getEmail(), u.getRole(), null, d.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("userId", u.getId());
        response.put("driverId", d.getId());
        response.put("accessToken", token);
        response.put("message", "Registration submitted. Awaiting verification.");
        return response;
    }

    public DriverProfileResponse getProfile(Long driverUserId) {
        DeliveryPartner d = drivers.findByUserId(driverUserId).orElseThrow(() -> new ResourceNotFoundException("Driver profile not found"));
        User u = users.findById(driverUserId).orElseThrow();
        return toDto(d, u);
    }

    public DriverProfileResponse updateProfile(Long driverUserId, DriverProfileUpdateRequest req) {
        User u = users.findById(driverUserId).orElseThrow();
        DeliveryPartner d = drivers.findByUserId(driverUserId).orElseThrow();
        if (req.name() != null) u.setName(req.name());
        if (req.email() != null) u.setEmail(req.email());
        if (req.profileImageUrl() != null) u.setProfileImageUrl(req.profileImageUrl());
        if (req.bankAccountNumber() != null) d.setBankAccountNumber(req.bankAccountNumber());
        if (req.bankIfsc() != null) d.setBankIfsc(req.bankIfsc());
        if (req.upiId() != null) d.setUpiId(req.upiId());
        users.save(u);
        return toDto(drivers.save(d), u);
    }

    public Map<String, Boolean> setOnline(Long driverUserId, boolean online) {
        DeliveryPartner d = drivers.findByUserId(driverUserId).orElseThrow();
        if (!Boolean.TRUE.equals(d.getIsVerified())) throw new BadRequestException("Account not verified");
        d.setIsOnline(online);
        drivers.save(d);
        
        String geoKey = "drivers:locations";
        if (online) {
            if (d.getCurrentLat() != null && d.getCurrentLng() != null) {
                redis.opsForGeo().add(geoKey, new org.springframework.data.geo.Point(d.getCurrentLng(), d.getCurrentLat()), String.valueOf(d.getId()));
            }
        } else {
            redis.opsForGeo().remove(geoKey, String.valueOf(d.getId()));
        }
        return Map.of("isOnline", online);
    }

    public DeliveryResponse currentAssignment(Long driverUserId) {
        DeliveryPartner d = drivers.findByUserId(driverUserId).orElseThrow();
        DeliveryAssignment a = assignments.findFirstByDriverIdAndStatusInOrderByCreatedAtDesc(
            d.getId(), List.of(AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.PICKED_UP)).orElse(null);
        if (a == null) return null;
        Order o = orders.findById(a.getOrderId()).orElse(null);
        return deliveryService.toDto(a, o);
    }

    public List<DeliveryResponse> availableAssignments(Long driverUserId) {
        DeliveryPartner d = drivers.findByUserId(driverUserId).orElseThrow();
        List<DeliveryAssignment> list = assignments.findByDriverIdAndStatus(d.getId(), AssignmentStatus.ASSIGNED);
        return list.stream().map(a -> {
            Order o = orders.findById(a.getOrderId()).orElse(null);
            return deliveryService.toDto(a, o);
        }).toList();
    }

    public PageResponse<DeliveryResponse> history(Long driverUserId, int page, int size) {
        DeliveryPartner d = drivers.findByUserId(driverUserId).orElseThrow();
        return PageResponse.of(assignments.findByDriverIdOrderByCreatedAtDesc(d.getId(), PageRequest.of(page, size))
            .map(a -> {
                Order o = orders.findById(a.getOrderId()).orElse(null);
                return deliveryService.toDto(a, o);
            }));
    }

    public DriverEarningsResponse earnings(Long driverUserId) {
        DeliveryPartner d = drivers.findByUserId(driverUserId).orElseThrow();
        Instant today = DateUtil.startOfToday();
        Instant weekAgo = DateUtil.startOfDaysAgo(7);
        List<DeliveryAssignment> recent = assignments.findByDriverIdOrderByCreatedAtDesc(d.getId(), PageRequest.of(0, 200))
            .stream().filter(a -> a.getStatus() == AssignmentStatus.DELIVERED && a.getDeliveredAt() != null).toList();
        List<DeliveryAssignment> todays = recent.stream().filter(a -> a.getDeliveredAt().isAfter(today)).toList();
        List<DeliveryAssignment> week = recent.stream().filter(a -> a.getDeliveredAt().isAfter(weekAgo)).toList();
        BigDecimal earningsToday = todays.stream().map(DeliveryAssignment::getEarningsAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal earningsWeek = week.stream().map(DeliveryAssignment::getEarningsAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, List<DeliveryAssignment>> byDay = week.stream().collect(Collectors.groupingBy(a ->
            LocalDate.ofInstant(a.getDeliveredAt(), ZoneOffset.UTC).toString()));
        List<DriverEarningsResponse.DaySeries> series = byDay.entrySet().stream().sorted(Map.Entry.comparingByKey())
            .map(e -> new DriverEarningsResponse.DaySeries(e.getKey(), e.getValue().size(),
                e.getValue().stream().map(DeliveryAssignment::getEarningsAmount).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add))).toList();
        return new DriverEarningsResponse(todays.size(), earningsToday, week.size(), earningsWeek, series,
            new DriverEarningsResponse.Incentive(10, todays.size(), new BigDecimal("100")));
    }

    public DriverProfileResponse toDto(DeliveryPartner d, User u) {
        return new DriverProfileResponse(d.getId(), u.getId(), u.getName(), u.getEmail(), u.getPhone(),
            u.getProfileImageUrl(), d.getVehicleType(), d.getVehicleMake(), d.getVehicleModel(),
            d.getVehicleRegNumber(), d.getBankAccountNumber(), d.getBankIfsc(), d.getUpiId(),
            d.getIsVerified(), d.getIsOnline(), d.getCurrentLat(), d.getCurrentLng(),
            d.getTotalDeliveries(), d.getAvgRating());
    }
}
