package com.example.products.repository;

import com.example.products.dto.CategoryDto;
import com.example.products.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    boolean existsByNameIgnoreCase(String name);

    @Query("""
        SELECT new com.example.products.dto.CategoryDto(
            c.id, 
            c.name, 
            c.icon, 
            c.description, 
            COUNT(p)
        ) 
        FROM Category c 
        LEFT JOIN Product p ON c.id = p.category.id 
        GROUP BY c.id, c.name, c.icon, c.description
        ORDER BY c.id ASC
    """)
    List<CategoryDto> findAllWithProductCount();
}