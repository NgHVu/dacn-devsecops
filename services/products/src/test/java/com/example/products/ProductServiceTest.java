package com.example.products;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void testGetById_Success() {
        Product sampleProduct = Product.builder().id(1L).name("Cơm Tấm").build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
        Product foundProduct = productService.getById(1L);
        assertThat(foundProduct).isNotNull();
        assertThat(foundProduct.getName()).isEqualTo("Cơm Tấm");
    }

    @Test
    void testGetById_NotFound_ShouldThrowException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> productService.getById(99L));
    }

    @Test
    void testCreate_Success() {
        ProductCreateRequest request = new ProductCreateRequest("Bún Bò Huế", new BigDecimal("45000"), "bun-bo.jpg");
        Product savedProduct = Product.builder().id(1L).name("Bún Bò Huế").build();
        when(productRepository.existsByNameIgnoreCase("Bún Bò Huế")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);
        Product createdProduct = productService.create(request);
        assertThat(createdProduct).isNotNull();
        assertThat(createdProduct.getId()).isEqualTo(1L);
    }

    @Test
    void testCreate_Conflict_ShouldThrowException() {
        ProductCreateRequest request = new ProductCreateRequest("Phở Bò", new BigDecimal("50000"), "pho-bo.jpg");
        when(productRepository.existsByNameIgnoreCase("Phở Bò")).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> productService.create(request));
    }
    
    @Test
    void testUpdatePartial_AllFields_Success() {
        Product existing = Product.builder().id(1L).name("Cũ").price(new BigDecimal("10000")).image("cu.jpg").build();
        ProductUpdateRequest request = new ProductUpdateRequest("Mới", new BigDecimal("20000"), "moi.jpg");
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));
        Product updated = productService.updatePartial(1L, request);
        assertThat(updated.getName()).isEqualTo("Mới");
        assertThat(updated.getPrice()).isEqualByComparingTo("20000.00");
        assertThat(updated.getImage()).isEqualTo("moi.jpg");
    }

    @Test
    void testUpdatePartial_NameConflict_ShouldThrowException() {
        Product existing = Product.builder().id(1L).name("Cơm").build();
        ProductUpdateRequest request = new ProductUpdateRequest("Phở", null, null);
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.existsByNameIgnoreCase("Phở")).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> productService.updatePartial(1L, request));
    }
    
    @Test
    void testUpdatePartial_InvalidPrice_ShouldThrowException() {
        Product existing = Product.builder().id(1L).name("Cơm").build();
        ProductUpdateRequest request = new ProductUpdateRequest(null, new BigDecimal("0.00"), null);
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        assertThrows(ResponseStatusException.class, () -> productService.updatePartial(1L, request));
    }
    
    @SuppressWarnings("unchecked")
    @Test
    void testList_SearchByName_ShouldCallCorrectRepoMethod() {
        Page<Product> productPage = new PageImpl<>(List.of());
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(productPage);
        productService.list("cơm", null, null, Pageable.unpaged());
        verify(productRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }
    
    @SuppressWarnings("unchecked")
    @Test
    void testList_SearchByPrice_ShouldCallCorrectRepoMethod() {
        Page<Product> productPage = new PageImpl<>(List.of());
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(productPage);
        productService.list(null, new BigDecimal("10000"), new BigDecimal("50000"), Pageable.unpaged());
        verify(productRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void testList_InvalidPriceRange_ShouldThrowException() {
        assertThrows(ResponseStatusException.class, () -> {
            productService.list(null, new BigDecimal("50000"), new BigDecimal("10000"), Pageable.unpaged());
        });
    }

    @Test
    void testDelete_Success() {
        when(productRepository.existsById(1L)).thenReturn(true);
        doNothing().when(productRepository).deleteById(1L);
        assertDoesNotThrow(() -> productService.delete(1L));
        verify(productRepository, times(1)).deleteById(1L);
    }
    
    @Test
    void testDelete_NotFound_ShouldThrowException() {
        when(productRepository.existsById(99L)).thenReturn(false);
        assertThrows(ResponseStatusException.class, () -> productService.delete(99L));
    }
    
    @SuppressWarnings("unchecked")
    @Test
    void testList_Success() {
        List<Product> productList = List.of(Product.builder().id(1L).name("Sản phẩm 1").build());
        Page<Product> productPage = new PageImpl<>(productList, Pageable.unpaged(), 1);
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(productPage);
        Page<Product> result = productService.list(null, null, null, Pageable.unpaged());
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Sản phẩm 1");
    }
}