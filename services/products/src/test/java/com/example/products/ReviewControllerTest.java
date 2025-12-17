package com.example.products;

import com.example.products.controller.ReviewController;
import com.example.products.dto.ReviewCreateRequest;
import com.example.products.dto.ReviewResponse;
import com.example.products.security.JwtAuthenticationEntryPoint;
import com.example.products.security.JwtTokenProvider;
import com.example.products.service.ReviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReviewController.class)
@AutoConfigureMockMvc(addFilters = false) // Tắt filter Spring Security nhưng vẫn inject được Principal vào Controller
class ReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReviewService reviewService;

    // --- MOCK CÁC BEAN BẢO MẬT CẦN THIẾT CHO CONTEXT LOAD ---
    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    // --------------------------------------------------------

    // Helper tạo Authentication giả
    private Authentication mockAuth(String username, String role) {
        return new UsernamePasswordAuthenticationToken(
                username,
                "password",
                Collections.singletonList(new SimpleGrantedAuthority(role))
        );
    }

    @Test
    @DisplayName("CreateReview: Should return 201 when authenticated")
    void createReview_Success() throws Exception {
        ReviewCreateRequest request = new ReviewCreateRequest(1L, 100L, 5, "Good", "UserA");
        ReviewResponse response = new ReviewResponse(10L, "user1", "UserA", 100L, 5, "Good", OffsetDateTime.now(), null);

        when(reviewService.createReview(eq("user1"), any(ReviewCreateRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/reviews")
                        .principal(mockAuth("user1", "ROLE_USER")) // Inject Auth
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10L));
    }

    @Test
    @DisplayName("CreateReview: Should return 401 when not authenticated")
    void createReview_Unauthorized() throws Exception {
        ReviewCreateRequest request = new ReviewCreateRequest(1L, 100L, 5, "Good", "UserA");

        mockMvc.perform(post("/api/reviews")
                        // Không truyền principal
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GetReviews: Should return 200 and Page")
    void getReviewsByProduct_Success() throws Exception {
        Page<ReviewResponse> page = new PageImpl<>(List.of(
                new ReviewResponse(10L, "user1", "UserA", 100L, 5, "Good", OffsetDateTime.now(), null)
        ));

        when(reviewService.getReviewsByProduct(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/reviews/product/{productId}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].rating").value(5));
    }

    @Test
    @DisplayName("UpdateReview: Should return 200 when authenticated")
    void updateReview_Success() throws Exception {
        ReviewCreateRequest request = new ReviewCreateRequest(1L, 100L, 4, "Updated", "UserA");
        ReviewResponse response = new ReviewResponse(10L, "user1", "UserA", 100L, 4, "Updated", OffsetDateTime.now(), OffsetDateTime.now());

        when(reviewService.updateReview(eq(10L), eq("user1"), any(ReviewCreateRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/reviews/{reviewId}", 10L)
                        .principal(mockAuth("user1", "ROLE_USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comment").value("Updated"));
    }

    @Test
    @DisplayName("DeleteReview: Should return 204 when authenticated")
    void deleteReview_Success() throws Exception {
        // Giả lập gọi service với userId="user1" và isAdmin=false
        doNothing().when(reviewService).deleteReview(10L, "user1", false);

        mockMvc.perform(delete("/api/reviews/{reviewId}", 10L)
                        .principal(mockAuth("user1", "ROLE_USER")))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DeleteReview: Should pass isAdmin=true when Admin")
    void deleteReview_AsAdmin() throws Exception {
        // Giả lập gọi service với userId="admin" và isAdmin=true
        doNothing().when(reviewService).deleteReview(10L, "admin", true);

        mockMvc.perform(delete("/api/reviews/{reviewId}", 10L)
                        .principal(mockAuth("admin", "ROLE_ADMIN")))
                .andExpect(status().isNoContent());
    }
}