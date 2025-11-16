package com.example.users.repository;

import com.example.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Spring sẽ tự động nhận diện và đăng ký nó như một Spring Bean.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Tìm kiếm một User dựa trên địa chỉ email.
     * Spring Data JPA sẽ tự động tạo ra câu lệnh query từ tên của phương thức này.
     *
     * @param email Email của người dùng cần tìm.
     * @return một Optional chứa User nếu tìm thấy, ngược lại trả về Optional rỗng.
     */
    Optional<User> findByEmail(String email);

    /**
     * Kiểm tra xem một email đã tồn tại trong cơ sở dữ liệu hay chưa.
     *
     * @param email Email cần kiểm tra.
     * @return true nếu email đã tồn tại, false nếu chưa.
     */
    boolean existsByEmail(String email);

    // Tìm users bằng token reset
    Optional<User> findByResetPasswordToken(String token);
}
