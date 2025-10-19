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

@ExtendWith(MockitoExtension.class) // Kích hoạt Mockito cho JUnit 5
class ProductServiceTest {

    @Mock // 🎭 Tạo "diễn viên đóng thế" cho Repository
    private ProductRepository productRepository;

    @InjectMocks // 🎬 Tiêm "diễn viên đóng thế" vào Service là đối tượng cần test
    private ProductService productService;

    // =========================================================
    // Test cho phương thức getById
    // =========================================================
    @Test
    void testGetById_Success() {
        // 1. Arrange (Sắp đặt): Chuẩn bị kịch bản
        Product sampleProduct = Product.builder().id(1L).name("Cơm Tấm").build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));

        // 2. Act (Hành động): Gọi phương thức cần test
        Product foundProduct = productService.getById(1L);

        // 3. Assert (Kiểm chứng): Kiểm tra kết quả
        assertThat(foundProduct).isNotNull();
        assertThat(foundProduct.getName()).isEqualTo("Cơm Tấm");
    }

    @Test
    void testGetById_NotFound_ShouldThrowException() {
        // Arrange: Dạy cho mock rằng không tìm thấy sản phẩm
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert: Kiểm tra xem có ném ra exception NOT_FOUND không
        assertThrows(ResponseStatusException.class, () -> productService.getById(99L));
    }

    // =========================================================
    // Test cho phương thức create
    // =========================================================
    @Test
    void testCreate_Success() {
        // Arrange
        ProductCreateRequest request = new ProductCreateRequest("Bún Bò Huế", new BigDecimal("45000"), "bun-bo.jpg");
        Product savedProduct = Product.builder().id(1L).name("Bún Bò Huế").build();

        when(productRepository.existsByNameIgnoreCase("Bún Bò Huế")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

        // Act
        Product createdProduct = productService.create(request);

        // Assert
        assertThat(createdProduct).isNotNull();
        assertThat(createdProduct.getId()).isEqualTo(1L);
    }

    @Test
    void testCreate_Conflict_ShouldThrowException() {
        // Arrange
        ProductCreateRequest request = new ProductCreateRequest("Phở Bò", new BigDecimal("50000"), "pho-bo.jpg");
        when(productRepository.existsByNameIgnoreCase("Phở Bò")).thenReturn(true);

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> productService.create(request));
    }

    // =========================================================
    // Test cho phương thức updatePartial
    // =========================================================
    @Test
    void testUpdatePartial_Success() {
        // Arrange
        Product existingProduct = Product.builder().id(1L).name("Cơm Gà Cũ").price(new BigDecimal("40000")).build();
        ProductUpdateRequest request = new ProductUpdateRequest("Cơm Gà Mới", new BigDecimal("42000"), null);

        when(productRepository.findById(1L)).thenReturn(Optional.of(existingProduct));
        when(productRepository.existsByNameIgnoreCase("Cơm Gà Mới")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Product updatedProduct = productService.updatePartial(1L, request);

        // Assert
        assertThat(updatedProduct.getName()).isEqualTo("Cơm Gà Mới");
        assertThat(updatedProduct.getPrice()).isEqualByComparingTo("42000.00");
    }

    // =========================================================
    // Test cho phương thức delete
    // =========================================================
    @Test
    void testDelete_Success() {
        // Arrange
        when(productRepository.existsById(1L)).thenReturn(true);
        // Không cần mock deleteById vì nó là void, nhưng ta có thể verify nó được gọi
        doNothing().when(productRepository).deleteById(1L);

        // Act & Assert: Kiểm tra xem hàm có chạy mà không ném ra lỗi không
        assertDoesNotThrow(() -> productService.delete(1L));

        // Verify: Đảm bảo rằng phương thức deleteById đã được gọi đúng 1 lần với ID là 1
        verify(productRepository, times(1)).deleteById(1L);
    }
    
    @Test
    void testDelete_NotFound_ShouldThrowException() {
        // Arrange
        when(productRepository.existsById(99L)).thenReturn(false);

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> productService.delete(99L));
    }

    // =========================================================
    // Test cho phương thức list (trường hợp cơ bản)
    // =========================================================
    @Test
    void testList_Success() {
        // Arrange
        List<Product> productList = List.of(Product.builder().id(1L).name("Sản phẩm 1").build());
        Page<Product> productPage = new PageImpl<>(productList, Pageable.unpaged(), 1);

        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(productPage);

        // Act
        Page<Product> result = productService.list(null, null, null, Pageable.unpaged());

        // Assert
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Sản phẩm 1");
    }
}