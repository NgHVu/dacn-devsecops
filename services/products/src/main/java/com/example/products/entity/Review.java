package com.example.products.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "reviews", indexes = {
    @Index(name = "idx_review_product", columnList = "product_id"),
    @Index(name = "idx_review_user_product", columnList = "user_id, product_id") // Để check user đã review chưa
})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId; // ID từ Users Service

    @Column(name = "user_name")
    private String userName; // Cache tên người dùng để hiển thị nhanh

    @Column(name = "order_id", nullable = false)
    private Long orderId; // ID đơn hàng để đảm bảo "Verified Purchase"

    @NotNull
    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    @Size(max = 500, message = "Bình luận không quá 500 ký tự")
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore // Tránh vòng lặp JSON vô hạn
    private Product product;
}