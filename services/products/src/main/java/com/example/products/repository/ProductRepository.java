package com.example.products.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.example.products.entity.Product;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

@Repository
@Transactional(readOnly = true)
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    
    Page<Product> findByNameContainingIgnoreCase(String keyword, Pageable pageable);

    List<Product> findAllByIdIn(Collection<Long> ids);

    boolean existsByNameIgnoreCase(String name);

    List<Product> findTop10ByOrderByUpdatedAtDesc();

    @Query("""
           select p
           from Product p 
           where p.price between :min and :max
           order by p.price asc
           """)
    Page<Product> searchByPriceRange(
        @Param("min") BigDecimal min,
        @Param("max") BigDecimal max,
        @Param("max") Pageable pageable
    );

    Page<Product> findByPriceBetweenOrderByPriceAsc(BigDecimal min, BigDecimal max, Pageable pageable);
    
    long countByCategoryId(Long categoryId);

    // [NEW] TRỪ KHO ATOMIC: Chỉ trừ khi stock >= quantity. Trả về 1 nếu thành công, 0 nếu thất bại (hết hàng)
    @Transactional
    @Modifying
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity - :quantity WHERE p.id = :id AND p.stockQuantity >= :quantity")
    int reduceStock(@Param("id") Long id, @Param("quantity") Integer quantity);

    // [NEW] HOÀN KHO ATOMIC (Khi hủy đơn)
    @Transactional
    @Modifying
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity + :quantity WHERE p.id = :id")
    void restoreStock(@Param("id") Long id, @Param("quantity") Integer quantity);

    // [NEW] ĐẾM SẢN PHẨM CÒN HÀNG (Cho Dashboard)
    // Spring Data JPA sẽ tự động chuyển đổi thành COUNT(p) FROM Product p WHERE p.stockQuantity > 0
    long countByStockQuantityGreaterThan(Integer stockQuantity); 
}