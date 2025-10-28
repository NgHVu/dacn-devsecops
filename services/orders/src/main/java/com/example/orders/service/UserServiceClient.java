package com.example.orders.service;

import com.example.orders.dto.UserDto;
import org.springframework.security.authentication.BadCredentialsException;

/**
 * Interface định nghĩa cách gọi sang Users Service. 
 * Chủ yếu để lấy ID người dùng dựa trên email.
 */
public interface UserServiceClient {

    /**
     * Lấy thông tin người dùng từ Users Service bằng email.
     *
     * @param email Email người dùng (thường lấy từ JWT).
     * @param bearerToken Token JWT để xác thực request.
     * @return UserDto chứa thông tin người dùng (tối thiểu là ID).
     * @throws BadCredentialsException Nếu không tìm thấy người dùng (lỗi 4xx).
     * @throws RuntimeException Nếu có lỗi kết nối/server từ Users Service (lỗi 5xx).
     */
    UserDto getUserByEmail(String email, String bearerToken);

}
