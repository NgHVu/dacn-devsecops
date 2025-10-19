package com.example.products;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

@Repository
@Transactional(readOnly = true)
// SỬA ĐỔI: Đổi tên Interface và Entity
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
        Pageable pageable
    );

    Page<Product> findByPriceBetweenOrderByPriceAsc(BigDecimal min, BigDecimal max, Pageable pageable);
}