package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "review_replies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReviewReply extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "review_id", nullable = false, unique = true)
    private Long reviewId;
    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;

    @Column(name = "reply_text", nullable = false, columnDefinition = "TEXT")
    private String replyText;

    @Column(name = "replied_at")
    private Instant repliedAt;
}
