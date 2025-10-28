package com.example.orders.entity; 

/**
 * Enum định nghĩa các trạng thái có thể có của một đơn hàng. 
 * Lưu trữ trạng thái vòng đời của một Order.
 */
public enum OrderStatus {
  
    // Đơn hàng đã được tạo nhưng chưa xử lý (ví dụ: chờ thanh toán).
    PENDING,

    
    // Đơn hàng đang được xử lý/chuẩn bị.
    PROCESSING,

    
    // Đơn hàng đã được giao cho đơn vị vận chuyển.    
    SHIPPED,

    
    // Đơn hàng đã giao thành công đến khách hàng.   
    DELIVERED,

    
    // Đơn hàng đã bị hủy (bởi người dùng hoặc hệ thống). 
    CANCELLED,

    // Đơn hàng thất bại (ví dụ: lỗi thanh toán). 
    FAILED
}
