package com.example.users;

import com.example.users.security.JwtAuthenticationFilter;
import com.example.users.security.JwtTokenProvider;
import com.example.users.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.IOException;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthenticationFilter Unit Tests")
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserService userService;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        // Clear Security Context before each test to ensure isolation
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        // Always clean up to avoid side effects on other tests
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("doFilterInternal: Success path - sets authentication with valid Bearer token")
    void doFilterInternal_ValidToken_SetsAuthentication() throws ServletException, IOException {
        // Given
        String jwt = "valid.jwt.token";
        String username = "test@example.com";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + jwt);
        MockHttpServletResponse response = new MockHttpServletResponse();

        UserDetails userDetails = new User(username, "password", Collections.emptyList());

        when(tokenProvider.validateToken(jwt)).thenReturn(true);
        when(tokenProvider.getUsername(jwt)).thenReturn(username);
        when(userService.loadUserByUsername(username)).thenReturn(userDetails);

        // When
        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo(username);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isInstanceOf(UsernamePasswordAuthenticationToken.class);
        
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal: Should proceed without auth when Authorization header is missing")
    void doFilterInternal_NoHeader_ProceedsWithoutAuth() throws ServletException, IOException {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        // When
        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(tokenProvider);
    }

    @Test
    @DisplayName("doFilterInternal: Should proceed without auth when prefix is not 'Bearer '")
    void doFilterInternal_InvalidPrefix_ProceedsWithoutAuth() throws ServletException, IOException {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz"); // Not Bearer
        MockHttpServletResponse response = new MockHttpServletResponse();

        // When
        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(tokenProvider);
    }

    @Test
    @DisplayName("doFilterInternal: Should not authenticate when token is invalid")
    void doFilterInternal_InvalidToken_DoesNotSetAuth() throws ServletException, IOException {
        // Given
        String jwt = "invalid.token";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + jwt);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(tokenProvider.validateToken(jwt)).thenReturn(false);

        // When
        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal: Should not override if authentication is already present")
    void doFilterInternal_AlreadyAuthenticated_DoesNotOverride() throws ServletException, IOException {
        // Given
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("existingUser", null, null)
        );

        String jwt = "valid.token";
        String username = "newUser";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + jwt);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(tokenProvider.validateToken(jwt)).thenReturn(true);
        when(tokenProvider.getUsername(jwt)).thenReturn(username);
        when(userService.loadUserByUsername(username)).thenReturn(
                new User(username, "", Collections.emptyList())
        );

        // When
        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        // Then
        // Should still be the existing user because of the check: getAuthentication() == null
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("existingUser");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal: Should catch exceptions and continue filter chain")
    void doFilterInternal_OnException_ContinuesChain() throws ServletException, IOException {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Trigger an unexpected exception
        when(tokenProvider.validateToken(anyString())).thenThrow(new RuntimeException("Unexpected error"));

        // When & Then
        // Filter should not propagate the exception but catch it and log it
        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal: Handles whitespace in header gracefully")
    void doFilterInternal_EmptyTokenInHeader_DoesNotSetAuth() throws ServletException, IOException {
        // Given
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer "); // Only prefix
        MockHttpServletResponse response = new MockHttpServletResponse();

        // When
        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }
}