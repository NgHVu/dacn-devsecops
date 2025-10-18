package com.example.products;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param; // <-- BẮT BUỘC IMPORT
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

@Repository // Giữ lại @Repository để làm rõ vai trò, dù nó là tùy chọn
@Transactional(readOnly = true) // Đặt readOnly ở cấp class, an toàn hơn
public interface ProductsRepository extends JpaRepository<Products, Long> {

    // Tìm theo tên (không phân biệt hoa/thường) + phân trang
    Page<Products> findByNameContainingIgnoreCase(String keyword, Pageable pageable);

    // Lấy nhiều sản phẩm theo danh sách ID
    List<Products> findAllByIdIn(Collection<Long> ids);

    // Kiểm tra trùng tên
    boolean existsByNameIgnoreCase(String name);

    // Top 10 cập nhật gần nhất
    List<Products> findTop10ByOrderByUpdatedAtDesc();

    // Tìm theo khoảng giá (JPQL tuỳ biến) + phân trang
    @Query("""
           select p
           from Products p
           where p.price between :min and :max
           order by p.price asc
           """)
    Page<Products> searchByPriceRange(
        @Param("min") BigDecimal min, // <-- SỬA LỖI: Thêm @Param("min")
        @Param("max") BigDecimal max, // <-- SỬA LỖI: Thêm @Param("max")
        Pageable pageable
    );

    // (Phiên bản thay thế - Dùng Derived Query)
    // Spring Data JPA tự hiểu tên phương thức và tạo ra câu query tương tự
    Page<Products> findByPriceBetweenOrderByPriceAsc(BigDecimal min, BigDecimal max, Pageable pageable);

}