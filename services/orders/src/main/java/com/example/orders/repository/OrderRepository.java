package com.example.orders.repository;

import com.example.orders.dto.MonthlyRevenue;
import com.example.orders.entity.Order;
import com.example.orders.entity.OrderStatus; 
import org.springframework.data.domain.Page; 
import org.springframework.data.domain.Pageable; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional; 

@Repository 
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserId(Long userId);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    List<Order> findByUserIdAndStatus(Long userId, OrderStatus status);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status <> 'CANCELLED'")
    BigDecimal sumTotalRevenue();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate")
    long countOrdersInPeriod(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);

    @Query("SELECT COUNT(DISTINCT o.userId) FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate")
    long countDistinctUsersInPeriod(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);

    @Query("""
       SELECT new com.example.orders.dto.MonthlyRevenue(
           YEAR(o.createdAt), 
           MONTH(o.createdAt), 
           SUM(o.totalAmount)
       ) 
       FROM Order o 
       WHERE o.status <> 'CANCELLED'
       GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)
       ORDER BY YEAR(o.createdAt), MONTH(o.createdAt)
       """)
    List<MonthlyRevenue> getMonthlyRevenue();
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate AND o.status <> 'CANCELLED'")
    BigDecimal sumRevenueInPeriod(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
}