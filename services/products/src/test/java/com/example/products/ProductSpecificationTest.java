package com.example.products;

import com.example.products.dto.ProductCriteria;
import com.example.products.entity.Product;
import com.example.products.repository.ProductSpecification;

import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductSpecificationTest {

    @Mock
    private Root<Product> root;
    @Mock
    private CriteriaQuery<?> query;
    @Mock
    private CriteriaBuilder cb;
    @Mock
    private Path<Object> path;
    @Mock
    private Expression<String> expressionStr;
    @Mock
    private Predicate predicate;

    @Test
    @DisplayName("Should return empty predicate when criteria is empty")
    void filterBy_EmptyCriteria() {
        ProductCriteria criteria = new ProductCriteria(null, null, null, null, null);
        
        // FIX: Sử dụng any(Predicate[].class) để khớp với tham số varargs (Predicate... restrictions)
        when(cb.and(any(Predicate[].class))).thenReturn(predicate);

        Specification<Product> spec = ProductSpecification.filterBy(criteria);
        Predicate result = spec.toPredicate(root, query, cb);

        assertThat(result).isNotNull();
        // Verify cũng cần dùng đúng matcher
        verify(cb).and(any(Predicate[].class));
    }

    @Test
    @DisplayName("Should add Search Name predicate")
    void filterBy_SearchName() {
        ProductCriteria criteria = new ProductCriteria("phone", null, null, null, null);
        
        when(root.get("name")).thenReturn(path);
        when(cb.lower(any())).thenReturn(expressionStr);
        when(cb.like(any(), anyString())).thenReturn(predicate);
        // FIX: Match varargs
        when(cb.and(any(Predicate[].class))).thenReturn(predicate);

        Specification<Product> spec = ProductSpecification.filterBy(criteria);
        spec.toPredicate(root, query, cb);

        verify(cb).like(any(), eq("%phone%"));
    }

    @Test
    @DisplayName("Should add Category ID predicate")
    void filterBy_CategoryId() {
        ProductCriteria criteria = new ProductCriteria(null, 10L, null, null, null);
        
        Path categoryPath = mock(Path.class);
        when(root.get("category")).thenReturn(categoryPath);
        when(categoryPath.get("id")).thenReturn(path);
        
        when(cb.equal(any(), eq(10L))).thenReturn(predicate);
        // FIX: Match varargs
        when(cb.and(any(Predicate[].class))).thenReturn(predicate);

        Specification<Product> spec = ProductSpecification.filterBy(criteria);
        spec.toPredicate(root, query, cb);

        verify(cb).equal(any(), eq(10L));
    }

    @Test
    @DisplayName("Should add Price Range predicates")
    void filterBy_PriceRange() {
        BigDecimal min = new BigDecimal("100");
        BigDecimal max = new BigDecimal("500");
        ProductCriteria criteria = new ProductCriteria(null, null, min, max, null);
        
        when(root.get("price")).thenReturn(path);
        when(cb.greaterThanOrEqualTo(any(), eq(min))).thenReturn(predicate);
        when(cb.lessThanOrEqualTo(any(), eq(max))).thenReturn(predicate);
        // FIX: Match varargs (ở đây sẽ nhận vào mảng 2 phần tử)
        when(cb.and(any(Predicate[].class))).thenReturn(predicate);

        Specification<Product> spec = ProductSpecification.filterBy(criteria);
        spec.toPredicate(root, query, cb);

        verify(cb).greaterThanOrEqualTo(any(), eq(min));
        verify(cb).lessThanOrEqualTo(any(), eq(max));
    }
}