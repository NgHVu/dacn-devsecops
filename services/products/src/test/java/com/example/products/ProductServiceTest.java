package com.example.products;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.server.ResponseStatusException;

import com.example.products.dto.ProductCreateRequest;
import com.example.products.dto.ProductCriteria; 
import com.example.products.dto.ProductStockRequest; // Import mới
import com.example.products.dto.ProductUpdateRequest;
import com.example.products.entity.Category;
import com.example.products.entity.Product;
import com.example.products.repository.CategoryRepository;
import com.example.products.repository.ProductRepository;
import com.example.products.service.ProductService;

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

    @Mock
    private CategoryRepository categoryRepository; 

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

    // [NEW] Test Get Top 10
    @Test
    void testGetTop10_ShouldCallRepo() {
        when(productRepository.findTop10ByOrderByUpdatedAtDesc()).thenReturn(List.of(new Product()));
        List<Product> result = productService.getTop10();
        assertThat(result).isNotEmpty();
        verify(productRepository, times(1)).findTop10ByOrderByUpdatedAtDesc();
    }

    // [NEW] Test Get Batch
    @Test
    void testGetBatch_ShouldCallRepo() {
        List<Long> ids = List.of(1L, 2L);
        when(productRepository.findAllByIdIn(ids)).thenReturn(List.of(new Product(), new Product()));
        List<Product> result = productService.getBatch(ids);
        assertThat(result).hasSize(2);
        verify(productRepository, times(1)).findAllByIdIn(ids);
    }

    @Test
    void testCreate_Success() {
        ProductCreateRequest request = new ProductCreateRequest("Bún Bò Huế", "Mô tả ngon", new BigDecimal("45000"), 50, "bun-bo.jpg", 1L);        
        Category mockCategory = new Category();
        mockCategory.setId(1L);
        Product savedProduct = Product.builder().id(1L).name("Bún Bò Huế").description("Mô tả ngon").build();
        
        when(productRepository.existsByNameIgnoreCase("Bún Bò Huế")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));
        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);
        
        Product createdProduct = productService.create(request);
        assertThat(createdProduct).isNotNull();
        assertThat(createdProduct.getId()).isEqualTo(1L);
    }

    @Test
    void testCreate_Conflict_ShouldThrowException() {
        ProductCreateRequest request = new ProductCreateRequest("Phở Bò", null, new BigDecimal("50000"), 100, "pho-bo.jpg", 1L);        
        when(productRepository.existsByNameIgnoreCase("Phở Bò")).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> productService.create(request));
    }
    
    @Test
    void testUpdatePartial_AllFields_Success() {
        Product existing = Product.builder().id(1L).name("Cũ").price(new BigDecimal("10000")).image("cu.jpg").build();
        ProductUpdateRequest request = new ProductUpdateRequest("Mới", "Mô tả mới", new BigDecimal("20000"), 20, "moi.jpg", null);        
        
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));
        
        Product updated = productService.updatePartial(1L, request);
        
        assertThat(updated.getName()).isEqualTo("Mới");
        assertThat(updated.getDescription()).isEqualTo("Mô tả mới"); 
        assertThat(updated.getPrice()).isEqualByComparingTo("20000.00");
        assertThat(updated.getImage()).isEqualTo("moi.jpg");
    }

    @Test
    void testUpdatePartial_NameConflict_ShouldThrowException() {
        Product existing = Product.builder().id(1L).name("Cơm").build();
        ProductUpdateRequest request = new ProductUpdateRequest("Phở", null, null, null, null, null);
        
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.existsByNameIgnoreCase("Phở")).thenReturn(true);
        
        assertThrows(ResponseStatusException.class, () -> productService.updatePartial(1L, request));
    }
    
    @Test
    void testUpdatePartial_InvalidPrice_ShouldThrowException() {
        Product existing = Product.builder().id(1L).name("Cơm").build();
        ProductUpdateRequest request = new ProductUpdateRequest(null, null, new BigDecimal("0.00"), null, null, null);
        
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        assertThrows(ResponseStatusException.class, () -> productService.updatePartial(1L, request));
    }
        
    @SuppressWarnings("unchecked")
    @Test
    void testGetAllProducts_Search_ShouldCallRepo() {
        Page<Product> productPage = new PageImpl<>(List.of());
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(productPage);
        ProductCriteria criteria = new ProductCriteria("cơm", null, null, null, "newest");
        
        productService.getAllProducts(criteria, PageRequest.of(0, 10));
        verify(productRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }
    
    @SuppressWarnings("unchecked")
    @Test
    void testGetAllProducts_FilterByPrice_ShouldCallRepo() {
        Page<Product> productPage = new PageImpl<>(List.of());
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(productPage);
        ProductCriteria criteria = new ProductCriteria(null, null, new BigDecimal("10000"), new BigDecimal("50000"), null);
        
        productService.getAllProducts(criteria, PageRequest.of(0, 10));
        verify(productRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
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

    // [NEW] Test Reduce Stock Success
    @Test
    void testReduceStock_Success() {
        List<ProductStockRequest> requests = List.of(new ProductStockRequest(1L, 5));
        when(productRepository.reduceStock(1L, 5)).thenReturn(1); // 1 = Success
        
        assertDoesNotThrow(() -> productService.reduceStock(requests));
        verify(productRepository, times(1)).reduceStock(1L, 5);
    }

    // [NEW] Test Reduce Stock Fail (Not enough stock)
    @Test
    void testReduceStock_Fail_ShouldThrowException() {
        List<ProductStockRequest> requests = List.of(new ProductStockRequest(1L, 100));
        when(productRepository.reduceStock(1L, 100)).thenReturn(0); // 0 = Fail
        
        assertThrows(ResponseStatusException.class, () -> productService.reduceStock(requests));
    }

    // [NEW] Test Restore Stock
    @Test
    void testRestoreStock_Success() {
        List<ProductStockRequest> requests = List.of(new ProductStockRequest(1L, 5));
        doNothing().when(productRepository).restoreStock(1L, 5);
        
        assertDoesNotThrow(() -> productService.restoreStock(requests));
        verify(productRepository, times(1)).restoreStock(1L, 5);
    }

    // [NEW] Test Count Active
    @Test
    void testCountActiveProducts_ShouldCallRepo() {
        when(productRepository.countByStockQuantityGreaterThan(0)).thenReturn(10L);
        long count = productService.countActiveProducts();
        assertThat(count).isEqualTo(10L);
    }
}