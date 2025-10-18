package com.example.products;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Products", description = "Endpoints quản lý sản phẩm")
@Validated
public class ProductsController {

    private final ProductsRepository repo;

    public ProductsController(ProductsRepository repo) {
        this.repo = repo;
    }

    // =========================================================
    // LIST + SEARCH + PAGINATION
    // =========================================================
    @GetMapping
    @Operation(summary = "Danh sách sản phẩm (phân trang + tìm kiếm)")
    public Page<Products> list(
            @Parameter(description = "Từ khóa tìm theo tên (không phân biệt hoa/thường)")
            @RequestParam(required = false) String q,

            @Parameter(description = "Giá tối thiểu (lọc theo khoảng)")
            @RequestParam(required = false) @DecimalMin("0.00") BigDecimal minPrice,

            @Parameter(description = "Giá tối đa (lọc theo khoảng)")
            @RequestParam(required = false) @DecimalMin("0.00") BigDecimal maxPrice,

            @PageableDefault(size = 10, sort = "updatedAt") Pageable pageable
    ) {
        // Ưu tiên lọc theo khoảng giá khi đủ 2 biên
        if (minPrice != null && maxPrice != null) {
            if (minPrice.compareTo(maxPrice) > 0) {
                throw new IllegalArgumentException("minPrice không được lớn hơn maxPrice");
            }
            return repo.searchByPriceRange(minPrice, maxPrice, pageable);
        }

        // Nếu có từ khóa -> search theo tên
        if (StringUtils.hasText(q)) {
            return repo.findByNameContainingIgnoreCase(q.trim(), pageable);
        }

        // Mặc định: trả về tất cả theo phân trang
        return repo.findAll(pageable);
    }

    // =========================================================
    // DETAIL
    // =========================================================
    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết sản phẩm theo ID")
    public ResponseEntity<Products> get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // =========================================================
    // TOP UPDATED
    // =========================================================
    @GetMapping("/top")
    @Operation(summary = "Top 10 sản phẩm cập nhật gần nhất")
    public List<Products> top10() {
        return repo.findTop10ByOrderByUpdatedAtDesc();
    }

    // =========================================================
    // BATCH BY IDS
    // =========================================================
    @GetMapping("/batch")
    @Operation(summary = "Lấy nhiều sản phẩm theo danh sách ID (query ?ids=1,2,3)")
    public List<Products> batch(@RequestParam List<Long> ids) {
        return repo.findAllByIdIn(ids);
    }

    // =========================================================
    // CREATE
    // =========================================================
    @PostMapping
    @Transactional
    @Operation(summary = "Tạo sản phẩm mới")
    public ResponseEntity<Products> create(@Valid @RequestBody ProductsCreateRequest req) {
        // Kiểm tra trùng tên (case-insensitive)
        if (repo.existsByNameIgnoreCase(req.name())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build(); // 409
        }

        // Chuẩn hoá price về 2 chữ số thập phân
        BigDecimal normalizedPrice = req.price().setScale(2, RoundingMode.HALF_UP);

        Products entity = Products.builder()
                .name(req.name().trim())
                .price(normalizedPrice)
                .image(req.image())
                .build();

        Products saved = repo.save(entity);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(saved.getId())
                .toUri();

        return ResponseEntity.created(location).body(saved); // 201 + Location
    }

    // =========================================================
    // PARTIAL UPDATE (PATCH) — cập nhật từng phần
    // =========================================================
    @PatchMapping("/{id}")
    @Transactional
    @Operation(summary = "Cập nhật một phần sản phẩm (PATCH)")
    public ResponseEntity<Products> updatePartial(
            @PathVariable Long id,
            @Valid @RequestBody ProductsUpdateRequest req
    ) {
        Optional<Products> optionalProduct = repo.findById(id);
        if (optionalProduct.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Products existing = optionalProduct.get();

        // name
        if (req.name() != null && StringUtils.hasText(req.name())) {
            String newName = req.name().trim();
            if (!newName.equalsIgnoreCase(existing.getName()) && repo.existsByNameIgnoreCase(newName)) {
                // Phải trả về kiểu ResponseEntity<Products>
                return ResponseEntity.status(HttpStatus.CONFLICT).build(); 
            }
            existing.setName(newName);
        }

        // price
        if (req.price() != null) {
            BigDecimal normalized = req.price().setScale(2, RoundingMode.HALF_UP);
            if (normalized.compareTo(BigDecimal.valueOf(0.01)) < 0) {
                // Phải trả về kiểu ResponseEntity<Products>
                return ResponseEntity.badRequest().build();
            }
            existing.setPrice(normalized);
        }

        // image
        if (req.image() != null) {
            existing.setImage(req.image());
        }

        Products updated = repo.save(existing);
        return ResponseEntity.ok(updated);
    }

    // =========================================================
    // DELETE
    // =========================================================
    @DeleteMapping("/{id}")
    @Transactional
    @Operation(summary = "Xoá sản phẩm theo ID")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        // Tách logic ra khỏi .map() để code rõ ràng hơn
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        repo.deleteById(id);
        return ResponseEntity.noContent().build(); // 204
    }

    // =========================================================
    // DTOs (đặt kèm file để dùng ngay; có thể tách file sau)
    // =========================================================
    public record ProductsCreateRequest(
            @jakarta.validation.constraints.NotBlank
            @jakarta.validation.constraints.Size(min = 1, max = 120)
            String name,

            @jakarta.validation.constraints.NotNull
            @DecimalMin("0.01")
            BigDecimal price,

            @jakarta.validation.constraints.Size(max = 255)
            String image
    ) {}

    public record ProductsUpdateRequest(
            @jakarta.validation.constraints.Size(min = 1, max = 120)
            String name,

            @DecimalMin("0.01")
            BigDecimal price,

            @jakarta.validation.constraints.Size(max = 255)
            String image
    ) {}
}
