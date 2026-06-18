package com.eets.service;

import com.eets.domain.User;
import com.eets.domain.Order;
import com.eets.domain.Restaurant;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username:noreply@eets.local}") private String from;
    @Value("${eets.frontend-urls.customer}") private String customerUrl;

    @Async("notificationExecutor")
    public void sendWelcomeEmail(User u) {
        try {
            send(u.getEmail(), "Welcome to eets!",
                "<h2>Hi " + u.getName() + ",</h2><p>Thanks for joining eets. Start ordering at " + customerUrl + "</p>");
        } catch (Exception e) {
            log.error("Failed to send email notification to userId={} for eventType=WELCOME_EMAIL: {}", u.getId(), e.getMessage(), e);
        }
    }

    @Async("notificationExecutor")
    public void sendOrderConfirmationEmail(Order o, User u) {
        try {
            send(u.getEmail(), "Order confirmed: " + o.getOrderNumber(),
                "<p>Hi " + u.getName() + ", your order <b>" + o.getOrderNumber() + "</b> for ₹" + o.getTotalAmount() + " is confirmed.</p>");
        } catch (Exception e) {
            log.error("Failed to send email notification to userId={} for eventType=ORDER_CONFIRMATION_EMAIL: {}", u.getId(), e.getMessage(), e);
        }
    }

    @Deprecated
    public void sendOrderConfirmation(Order o, User u) {
        sendOrderConfirmationEmail(o, u);
    }

    @Async
    public void sendOrderDelivered(Order o, User u) {
        send(u.getEmail(), "Order delivered: " + o.getOrderNumber(),
            "<p>Your order <b>" + o.getOrderNumber() + "</b> was delivered. Enjoy!</p>");
    }

    @Async("notificationExecutor")
    public void sendPasswordResetEmail(User u, String token) {
        try {
            String link = customerUrl + "/reset-password?token=" + token;
            send(u.getEmail(), "Reset your eets password",
                "<p>Click to reset: <a href=\"" + link + "\">" + link + "</a> (valid 15 minutes)</p>");
        } catch (Exception e) {
            log.error("Failed to send email notification to userId={} for eventType=PASSWORD_RESET_EMAIL: {}", u.getId(), e.getMessage(), e);
        }
    }
    @Async
    public void sendRestaurantApproved(User vendor, Restaurant r) {
        send(vendor.getEmail(), "Your restaurant is approved",
            "<p>Congratulations! <b>" + r.getName() + "</b> is now live on eets.</p>");
    }
    @Async
    public void sendRestaurantRejected(User vendor, Restaurant r, String reason) {
        send(vendor.getEmail(), "Restaurant registration update",
            "<p><b>" + r.getName() + "</b> was not approved. Reason: " + reason + "</p>");
    }
    @Async
    public void sendRefundConfirmation(Order o, BigDecimal amount, User u) {
        send(u.getEmail(), "Refund initiated for " + o.getOrderNumber(),
            "<p>Refund of ₹" + amount + " has been initiated for order " + o.getOrderNumber() + ".</p>");
    }
    @Async
    public void sendBanNotice(User u, String reason) {
        send(u.getEmail(), "Your eets account has been suspended",
            "<p>Reason: " + reason + ". Contact support@eets.com to appeal.</p>");
    }

    private void send(String to, String subject, String html) {
        if (to == null || to.isBlank()) return;
        try {
            MimeMessage m = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(m, "UTF-8");
            h.setFrom(from); h.setTo(to); h.setSubject(subject); h.setText(html, true);
            mailSender.send(m);
        } catch (Exception e) {
            log.warn("Email send failed to {}: {}", to, e.getMessage());
        }
    }
}
