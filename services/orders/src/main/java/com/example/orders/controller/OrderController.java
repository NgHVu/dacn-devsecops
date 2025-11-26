package com.example.orders.controller;

import com.example.orders.dto.DashboardStats;
import com.example.orders.dto.OrderCreateRequest;
import com.example.orders.dto.OrderResponse;
import com.example.orders.dto.OrderStatusUpdate;
import com.example.orders.dto.DashboardStats; 
import com.example.orders.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Order Controller", description = "APIs quản lý đơn hàng (User & Admin)")
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;

    @Operation(summary = "Tạo đơn hàng mới", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody OrderCreateRequest orderRequest,
            @Parameter(hidden = true) @RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(orderRequest, bearerToken));
    }

    @Operation(summary = "Lịch sử đơn hàng của tôi", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/my")
    public ResponseEntity<Page<OrderResponse>> getMyOrders(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication,
            @Parameter(hidden = true) @RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.ok(orderService.getOrders(authentication.getName(), bearerToken, pageable));
    }

    @Operation(summary = "Chi tiết đơn hàng", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable Long orderId,
            Authentication authentication,
            @Parameter(hidden = true) @RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.ok(orderService.getOrderById(orderId, authentication.getName(), bearerToken));
    }

    @Operation(
            summary = "[ADMIN] Lấy tất cả đơn hàng",
            description = "Lấy danh sách toàn bộ đơn hàng trong hệ thống. Chỉ Admin mới được gọi.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "403", description = "Không có quyền Admin")
    @GetMapping
    public ResponseEntity<Page<OrderResponse>> getAllOrders(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        log.info("Admin đang lấy danh sách toàn bộ đơn hàng...");
        return ResponseEntity.ok(orderService.getAllOrders(pageable));
    }

    @Operation(
            summary = "[ADMIN] Cập nhật trạng thái đơn hàng",
            description = "Chuyển trạng thái đơn hàng (VD: PENDING -> CONFIRMED). Có kiểm tra luồng hợp lệ.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Cập nhật thành công")
    @ApiResponse(responseCode = "400", description = "Trạng thái không hợp lệ hoặc vi phạm luồng")
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody OrderStatusUpdate statusUpdate) {
        
        log.info("Admin cập nhật đơn hàng ID: {} sang trạng thái: {}", orderId, statusUpdate.getStatus());
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, statusUpdate));
    }

    @Operation(
            summary = "[ADMIN] Lấy thống kê Dashboard",
            description = "Trả về tổng doanh thu, tăng trưởng, biểu đồ tháng và đơn hàng mới nhất.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @PreAuthorize("hasRole('ADMIN')") 
    @GetMapping("/admin/dashboard")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        log.info("Admin đang lấy dữ liệu thống kê Dashboard...");
        return ResponseEntity.ok(orderService.getDashboardStats());
    }
}