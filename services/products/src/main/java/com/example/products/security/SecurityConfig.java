package com.example.products.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    
    // API Path Constants to avoid Magic Strings
    private static final String API_PRODUCTS_PUBLIC = "/api/products/**";
    private static final String API_PRODUCTS_INTERNAL = "/api/products/internal/**";
    private static final String API_CATEGORIES_PUBLIC = "/api/categories/**";
    private static final String API_REVIEWS_PUBLIC = "/api/reviews/product/**";
    
    // Swagger/Docs Paths
    private static final String[] SWAGGER_WHITELIST = {
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/actuator/**",
            "/error"
    };

    private final JwtAuthenticationEntryPoint unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(unauthorizedHandler)
            )
            
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            .authorizeHttpRequests(authorize -> authorize
                // 1. Static Resources & Docs
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers(SWAGGER_WHITELIST).permitAll()
                
                // 2. Internal Service APIs (Authenticated Users/Services)
                .requestMatchers(HttpMethod.POST, API_PRODUCTS_INTERNAL).authenticated()

                // 3. Public GET APIs
                .requestMatchers(HttpMethod.GET, "/api/products").permitAll() // List
                .requestMatchers(HttpMethod.GET, API_PRODUCTS_PUBLIC).permitAll() // Detail
                .requestMatchers(HttpMethod.GET, "/api/categories").permitAll()
                .requestMatchers(HttpMethod.GET, API_CATEGORIES_PUBLIC).permitAll()
                .requestMatchers(HttpMethod.GET, API_REVIEWS_PUBLIC).permitAll()
                
                // 4. Admin Management APIs
                .requestMatchers(HttpMethod.POST, API_PRODUCTS_PUBLIC).hasAuthority(ROLE_ADMIN)
                .requestMatchers(HttpMethod.PATCH, API_PRODUCTS_PUBLIC).hasAuthority(ROLE_ADMIN)
                .requestMatchers(HttpMethod.DELETE, API_PRODUCTS_PUBLIC).hasAuthority(ROLE_ADMIN)
                
                // 5. Default
                .anyRequest().authenticated()
            )
            
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}