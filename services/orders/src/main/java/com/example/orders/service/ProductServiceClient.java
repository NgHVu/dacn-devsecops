package com.example.orders.service;

import com.example.orders.dto.ProductDto; 
import com.example.orders.dto.ProductStockRequest;
import java.util.List;
import java.util.Set;

public interface ProductServiceClient {
    List<ProductDto> getProductsByIds(Set<Long> productIds, String bearerToken);
    
    void reduceStock(List<ProductStockRequest> requests, String bearerToken);
    void restoreStock(List<ProductStockRequest> requests, String bearerToken);
    
    // [NEW] Method để lấy số lượng sản phẩm đang active cho Dashboard
    long countActiveProducts();
}