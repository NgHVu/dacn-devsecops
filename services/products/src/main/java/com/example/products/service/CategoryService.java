package com.example.products.service;

import com.example.products.dto.CategoryCreateRequest;
import com.example.products.dto.CategoryDto;
import com.example.products.entity.Category;
import com.example.products.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(CategoryDto::fromEntity)
                .collect(Collectors.toList());
    }

    public CategoryDto createCategory(CategoryCreateRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Danh mục đã tồn tại: " + request.name());
        }

        Category category = Category.builder()
                .name(request.name())
                .description(request.description())
                .build();

        return CategoryDto.fromEntity(categoryRepository.save(category));
    }
}