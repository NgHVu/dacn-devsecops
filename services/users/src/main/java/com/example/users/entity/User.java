package com.example.users.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.OffsetDateTime;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String email;

    // JsonIgnore để không trả về password trong các response API
    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name; 

    // Thêm các trường auditing để ghi vết thời gian
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "verification_otp")
    private String verificationOtp; // Mã OTP

    @Column(name = "otp_generated_time")
    private LocalDateTime otpGeneratedTime; // Thời gian tạo OTP (để check hết hạn)

    @Column(name = "is_verified", columnDefinition = "boolean default false")
    @Builder.Default // Đảm bảo giá trị mặc định khi dùng @Builder
    private boolean isVerified = false; // Mặc định là CHƯA xác thực

    // --- Các phương thức của UserDetails ---
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        // Tài khoản chỉ "Enabled" (hoạt động) khi đã được xác thực
        return this.isVerified;
    }
}
