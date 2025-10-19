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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @SuppressWarnings("removal")
    @MockBean
    private ProductService productService;

    @Test
    void testList_ShouldReturn200OK() throws Exception {
        Page<Product> emptyPage = Page.empty();
        given(productService.list(any(), any(), any(), any())).willReturn(emptyPage);

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk());
    }
    
    @Test
    void testGetById_ShouldReturn200OK() throws Exception {
        Product sampleProduct = Product.builder().id(1L).name("Cơm Tấm").build();
        given(productService.getById(1L)).willReturn(sampleProduct);

        mockMvc.perform(get("/api/products/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Cơm Tấm"));
    }
    
    @Test
    void testCreate_ShouldReturn201Created() throws Exception {
        ProductCreateRequest request = new ProductCreateRequest("Phở Bò", new BigDecimal("50000"), "pho.jpg");
        Product savedProduct = Product.builder().id(1L).name("Phở Bò").build();
        given(productService.create(any(ProductCreateRequest.class))).willReturn(savedProduct);

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"));
    }
    
    // =========================================================
    // == BỔ SUNG: Test cho endpoint PATCH /api/products/{id} ==
    // =========================================================
    @Test
    void testUpdatePartial_ShouldReturn200OK() throws Exception {
        // Arrange
        ProductUpdateRequest request = new ProductUpdateRequest("Tên Mới", null, null);
        Product updatedProduct = Product.builder().id(1L).name("Tên Mới").build();
        given(productService.updatePartial(eq(1L), any(ProductUpdateRequest.class))).willReturn(updatedProduct);
        
        // Act & Assert
        mockMvc.perform(patch("/api/products/{id}", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tên Mới"));
    }

    @Test
    void testDelete_ShouldReturn204NoContent() throws Exception {
        mockMvc.perform(delete("/api/products/{id}", 1L))
                .andExpect(status().isNoContent());
    }
}