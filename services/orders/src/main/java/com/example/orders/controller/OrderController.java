package com.example.orders.controller;

import com.example.orders.dto.OrderCreateRequest;
import com.example.orders.dto.OrderResponse;
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
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Sort;

@Tag(name = "Order Controller", description = "APIs để quản lý đơn hàng")
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;

    @Operation(
            summary = "Tạo một đơn hàng mới",
            description = "Tạo một đơn hàng mới từ giỏ hàng. Yêu cầu xác thực.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "201", description = "Tạo đơn hàng thành công",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderResponse.class)))
    @ApiResponse(responseCode = "400", description = "Dữ liệu đầu vào không hợp lệ (ví dụ: số lượng < 1)", content = @Content)
    @ApiResponse(responseCode = "401", description = "Chưa xác thực hoặc token không hợp lệ", content = @Content)
    @ApiResponse(responseCode = "404", description = "Không tìm thấy sản phẩm hoặc người dùng", content = @Content)
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody OrderCreateRequest orderRequest,
            @Parameter(hidden = true)
            @RequestHeader("Authorization") String bearerToken) {

        log.info("Nhận được yêu cầu tạo đơn hàng...");
        OrderResponse createdOrder = orderService.createOrder(orderRequest, bearerToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    @Operation(
            summary = "Lấy lịch sử đơn hàng của người dùng hiện tại",
            description = "Trả về danh sách đơn hàng (có phân trang) của người dùng đã xác thực.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class)))
    @ApiResponse(responseCode = "401", description = "Chưa xác thực", content = @Content)
    @GetMapping("/my")
    public ResponseEntity<Page<OrderResponse>> getMyOrders(
            @Parameter(hidden = true)
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication,
            @Parameter(hidden = true) @RequestHeader("Authorization") String bearerToken) {

        String userEmail = authentication.getName();
        log.info("Lấy lịch sử đơn hàng cho user email: {}", userEmail);

        Page<OrderResponse> ordersPage = orderService.getOrders(userEmail, bearerToken, pageable);
        return ResponseEntity.ok(ordersPage);
    }

    @Operation(
            summary = "Lấy chi tiết một đơn hàng cụ thể",
            description = "Trả về chi tiết của một đơn hàng theo ID. Chỉ chủ sở hữu mới có quyền xem.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Tìm thấy đơn hàng",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderResponse.class)))
    @ApiResponse(responseCode = "401", description = "Chưa xác thực", content = @Content)
    @ApiResponse(responseCode = "404", description = "Không tìm thấy đơn hàng hoặc không có quyền xem", content = @Content)
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(
            @Parameter(description = "ID của đơn hàng cần xem") @PathVariable Long orderId,
            Authentication authentication,
            @Parameter(hidden = true) @RequestHeader("Authorization") String bearerToken) {

        String userEmail = authentication.getName();
        log.info("Lấy chi tiết đơn hàng ID: {} cho user email: {}", orderId, userEmail);

        OrderResponse order = orderService.getOrderById(orderId, userEmail, bearerToken);
        return ResponseEntity.ok(order);
    }
}