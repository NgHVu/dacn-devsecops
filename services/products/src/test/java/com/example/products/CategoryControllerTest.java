package com.example.products;

import com.example.products.controller.CategoryController;
import com.example.products.dto.CategoryCreateRequest;
import com.example.products.dto.CategoryDto;
import com.example.products.security.JwtAuthenticationEntryPoint;
import com.example.products.security.JwtTokenProvider;
import com.example.products.service.CategoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CategoryService categoryService;

    // --- MOCK CÁC BEAN BẢO MẬT ---
    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    // ----------------------------

    @Test
    @DisplayName("GetAll: Should return 200 and list")
    void getAllCategories_Success() throws Exception {
        List<CategoryDto> categories = List.of(new CategoryDto(1L, "Food", "icon", "desc", 0L));
        when(categoryService.getAllCategories()).thenReturn(categories);

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].name").value("Food"));
    }

    @Test
    @DisplayName("Create: Should return 200 and created dto")
    void createCategory_Success() throws Exception {
        CategoryCreateRequest request = new CategoryCreateRequest("New Cat", "icon.png", "Description");
        CategoryDto response = new CategoryDto(1L, "New Cat", "icon.png", "Description", 0L);

        when(categoryService.createCategory(any(CategoryCreateRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Cat"));
    }

    @Test
    @DisplayName("Update: Should return 200 and updated dto")
    void updateCategory_Success() throws Exception {
        CategoryCreateRequest request = new CategoryCreateRequest("Update Name", "icon", "desc");
        CategoryDto response = new CategoryDto(1L, "Update Name", "icon", "desc", 0L);

        when(categoryService.updateCategory(eq(1L), any(CategoryCreateRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/categories/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Update Name"));
    }

    @Test
    @DisplayName("Delete: Should return 204 No Content")
    void deleteCategory_Success() throws Exception {
        doNothing().when(categoryService).deleteCategory(1L);

        mockMvc.perform(delete("/api/categories/{id}", 1L))
                .andExpect(status().isNoContent());
    }
}