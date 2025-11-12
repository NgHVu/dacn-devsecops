package com.example.orders.repository;

import com.example.orders.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * @param orderId ID của đơn hàng mà mình muốn xem các món hàng bên trong.
     * @return Một danh sách (List) chứa tất cả các món hàng tìm được. Trả về list rỗng nếu không có món nào.
     */
    List<OrderItem> findByOrderId(Long orderId);

}