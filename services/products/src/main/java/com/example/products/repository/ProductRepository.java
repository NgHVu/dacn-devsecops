package com.example.products.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
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
        Pageable pageable
    );

    Page<Product> findByPriceBetweenOrderByPriceAsc(BigDecimal min, BigDecimal max, Pageable pageable);
    
    long countByCategoryId(Long categoryId);
}