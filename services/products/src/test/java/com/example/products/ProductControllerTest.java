package com.example.products;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Annotation để chỉ test tầng Web (Controller)
@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc; // 🎭 "Diễn viên đóng thế" cho việc gửi request HTTP

    @Autowired
    private ObjectMapper objectMapper; // Dùng để chuyển đổi object Java thành chuỗi JSON

    @SuppressWarnings("removal")
    @MockBean // 🎭 Tạo "diễn viên đóng thế" cho Service
    private ProductService productService;

    // === Test cho endpoint GET /api/products ===
    @Test
    void testList_ShouldReturn200OK() throws Exception {
        // 1. Arrange (Sắp đặt)
        // Dạy cho Service giả lập: "Khi ai đó gọi hàm list, hãy trả về một trang rỗng"
        Page<Product> emptyPage = Page.empty();
        given(productService.list(any(), any(), any(), any())).willReturn(emptyPage);

        // 2. Act & 3. Assert (Hành động & Kiểm chứng)
        // Gửi một request GET ảo và kiểm tra xem có nhận về status 200 OK không
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk());
    }
    
    // === Test cho endpoint GET /api/products/{id} ===
    @Test
    void testGetById_ShouldReturn200OK() throws Exception {
        // Arrange
        Product sampleProduct = Product.builder().id(1L).name("Cơm Tấm").build();
        given(productService.getById(1L)).willReturn(sampleProduct);

        // Act & Assert
        mockMvc.perform(get("/api/products/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Cơm Tấm")); // Kiểm tra nội dung JSON trả về
    }
    
    // === Test cho endpoint POST /api/products ===
    @Test
    void testCreate_ShouldReturn201Created() throws Exception {
        // Arrange
        ProductCreateRequest request = new ProductCreateRequest("Phở Bò", new BigDecimal("50000"), "pho.jpg");
        Product savedProduct = Product.builder().id(1L).name("Phở Bò").build();
        given(productService.create(any(ProductCreateRequest.class))).willReturn(savedProduct);

        // Act & Assert
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))) // Chuyển request thành JSON
                .andExpect(status().isCreated()) // Kiểm tra status 201 Created
                .andExpect(header().exists("Location")); // Kiểm tra có header Location không
    }

    // === Test cho endpoint DELETE /api/products/{id} ===
    @Test
    void testDelete_ShouldReturn204NoContent() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/products/{id}", 1L))
                .andExpect(status().isNoContent()); // Kiểm tra status 204 No Content
    }
}