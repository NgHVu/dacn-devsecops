package com.example.products.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.example.products.dto.ProductCreateRequest;
import com.example.products.dto.ProductCriteria; 
import com.example.products.dto.ProductUpdateRequest;
import com.example.products.entity.Product;
import com.example.products.service.ProductService;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Products", description = "Endpoints quản lý sản phẩm")
@Validated
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Danh sách sản phẩm (Lọc nâng cao: Tên, Giá, Danh mục, Sắp xếp)")
    public ResponseEntity<Page<Product>> list(
            @Parameter(description = "Từ khóa tìm theo tên")
            @RequestParam(required = false) String search,

            @Parameter(description = "ID danh mục sản phẩm")
            @RequestParam(required = false) Long categoryId, 

            @Parameter(description = "Giá tối thiểu")
            @RequestParam(required = false) @DecimalMin("0.00") BigDecimal minPrice,

            @Parameter(description = "Giá tối đa")
            @RequestParam(required = false) @DecimalMin("0.00") BigDecimal maxPrice,

            @Parameter(description = "Sắp xếp: 'price_asc', 'price_desc', 'newest' (mặc định)")
            @RequestParam(required = false, defaultValue = "newest") String sort, 

            @Parameter(hidden = true)
            @PageableDefault(size = 10) Pageable pageable
    ) {
        ProductCriteria criteria = new ProductCriteria(search, categoryId, minPrice, maxPrice, sort);
        
        return ResponseEntity.ok(service.getAllProducts(criteria, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết sản phẩm theo ID")
    public ResponseEntity<Product> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/top")
    @Operation(summary = "Top 10 sản phẩm cập nhật gần nhất")
    public ResponseEntity<List<Product>> top10() {
        return ResponseEntity.ok(service.getTop10());
    }

    @GetMapping("/batch")
    @Operation(summary = "Lấy nhiều sản phẩm theo danh sách ID")
    public ResponseEntity<List<Product>> batch(@RequestParam List<Long> ids) {
        return ResponseEntity.ok(service.getBatch(ids));
    }

    @PostMapping
    @Operation(summary = "Tạo sản phẩm mới")
    public ResponseEntity<Product> create(@Valid @RequestBody ProductCreateRequest req) {
        Product saved = service.create(req);
        
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(saved.getId())
                .toUri();

        return ResponseEntity.created(location).body(saved);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Cập nhật một phần sản phẩm (PATCH)")
    public ResponseEntity<Product> updatePartial(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest req
    ) {
        return ResponseEntity.ok(service.updatePartial(id, req));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xoá sản phẩm theo ID")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}