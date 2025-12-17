package com.example.products;

import com.example.products.dto.CategoryCreateRequest;
import com.example.products.dto.CategoryDto;
import com.example.products.entity.Category;
import com.example.products.exception.ResourceNotFoundException;
import com.example.products.repository.CategoryRepository;
import com.example.products.repository.ProductRepository;
import com.example.products.service.CategoryService; // Import service từ package con
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    @DisplayName("GetAll: Should return list of categories")
    void getAllCategories_Success() {
        when(categoryRepository.findAllWithProductCount()).thenReturn(List.of(new CategoryDto(1L, "Food", "icon", "desc", 10L)));
        
        List<CategoryDto> result = categoryService.getAllCategories();
        
        assertThat(result).hasSize(1);
        verify(categoryRepository).findAllWithProductCount();
    }

    @Test
    @DisplayName("Create: Should create category successfully")
    void createCategory_Success() {
        CategoryCreateRequest req = new CategoryCreateRequest("New Cat", "Desc", "icon.png");
        Category savedCategory = Category.builder().id(1L).name("New Cat").icon("icon.png").description("Desc").build();
        
        when(categoryRepository.existsByNameIgnoreCase("New Cat")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(savedCategory);

        CategoryDto result = categoryService.createCategory(req);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("New Cat");
    }

    @Test
    @DisplayName("Create: Should throw 409 if name exists")
    void createCategory_Conflict() {
        CategoryCreateRequest req = new CategoryCreateRequest("Exist", "Desc", "icon");
        when(categoryRepository.existsByNameIgnoreCase("Exist")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    @DisplayName("Update: Should update category fields")
    void updateCategory_Success() {
        Category existing = Category.builder().id(1L).name("Old").build();
        CategoryCreateRequest req = new CategoryCreateRequest("New Name", "New Desc", "New Icon");
        
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

        CategoryDto result = categoryService.updateCategory(1L, req);

        assertThat(result.name()).isEqualTo("New Name");
        assertThat(result.description()).isEqualTo("New Desc");
        assertThat(result.icon()).isEqualTo("New Icon");
    }

    @Test
    @DisplayName("Update: Should throw NotFound if id invalid")
    void updateCategory_NotFound() {
        CategoryCreateRequest req = new CategoryCreateRequest("Name", "Desc", "Icon");
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.updateCategory(99L, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Delete: Should throw 400 if category has products")
    void deleteCategory_HasProducts() {
        Category category = new Category();
        category.setId(1L);
        
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.countByCategoryId(1L)).thenReturn(5L); // Has 5 products

        assertThatThrownBy(() -> categoryService.deleteCategory(1L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400"); // BAD_REQUEST
    }

    @Test
    @DisplayName("Delete: Should delete if no products")
    void deleteCategory_Success() {
        Category category = new Category();
        category.setId(1L);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.countByCategoryId(1L)).thenReturn(0L);

        categoryService.deleteCategory(1L);

        verify(categoryRepository).delete(category);
    }
}