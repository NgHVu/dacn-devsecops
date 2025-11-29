package com.example.products.service;

import com.example.products.dto.CategoryCreateRequest;
import com.example.products.dto.CategoryDto;
import com.example.products.entity.Category;
import com.example.products.exception.ResourceNotFoundException; 
import com.example.products.repository.CategoryRepository;
import com.example.products.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAllWithProductCount();
    }

    public CategoryDto createCategory(CategoryCreateRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Danh mục đã tồn tại: " + request.name());
        }

        Category category = Category.builder()
                .name(request.name())
                .description(request.description())
                .icon(request.icon())
                .build();

        Category saved = categoryRepository.save(category);
        return new CategoryDto(saved.getId(), saved.getName(), saved.getIcon(), saved.getDescription(), 0L);
    }

    public CategoryDto updateCategory(Long id, CategoryCreateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        
        category.setName(request.name());
        category.setDescription(request.description());
        category.setIcon(request.icon());
        
        Category updated = categoryRepository.save(category);
        return new CategoryDto(updated.getId(), updated.getName(), updated.getIcon(), updated.getDescription(), 0L);
    }

    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể xóa danh mục đang chứa " + productCount + " sản phẩm. Vui lòng xóa sản phẩm trước.");
        }

        categoryRepository.delete(category);
    }
}