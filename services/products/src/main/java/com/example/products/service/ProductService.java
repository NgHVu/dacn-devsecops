package com.example.products.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest; // <-- Mới
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;        // <-- Mới
import org.springframework.data.jpa.domain.Specification; 
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.example.products.dto.ProductCreateRequest;
import com.example.products.dto.ProductCriteria;     // <-- Mới
import com.example.products.dto.ProductUpdateRequest;
import com.example.products.entity.Product;
import com.example.products.repository.ProductRepository;
import com.example.products.repository.ProductSpecification; // <-- Mới

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository repo;

    // --- LOGIC CHO READ (Đã nâng cấp Advanced Filter) ---
    @Transactional(readOnly = true)
    public Page<Product> getAllProducts(ProductCriteria criteria, Pageable pageable) {
        // 1. Tạo Specification từ Criteria (Logic lọc nằm ở file ProductSpecification)
        Specification<Product> spec = ProductSpecification.filterBy(criteria);

        // 2. Xử lý Logic Sắp xếp
        // Mặc định sắp xếp theo ngày cập nhật giảm dần (mới nhất lên đầu)
        Sort sort = Sort.by("updatedAt").descending();

        if (StringUtils.hasText(criteria.sort())) {
            switch (criteria.sort()) {
                case "price_asc" -> sort = Sort.by("price").ascending();
                case "price_desc" -> sort = Sort.by("price").descending();
                case "name_asc" -> sort = Sort.by("name").ascending();
                case "newest" -> sort = Sort.by("updatedAt").descending();
                default -> {
                    // Nếu chuỗi sort không khớp case nào, kiểm tra xem pageable gốc có sort không
                    if (pageable.getSort().isSorted()) {
                        sort = pageable.getSort();
                    }
                }
            }
        }

        // 3. Tạo Pageable mới kết hợp trang hiện tại và sort đã chốt
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        // 4. Gọi Repository (đã extends JpaSpecificationExecutor)
        return repo.findAll(spec, sortedPageable);
    }

    @Transactional(readOnly = true)
    public Product getById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Product> getTop10() {
        return repo.findTop10ByOrderByUpdatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Product> getBatch(List<Long> ids) {
        return repo.findAllByIdIn(ids);
    }

    // --- LOGIC CHO CREATE ---
    public Product create(ProductCreateRequest req) {
        if (repo.existsByNameIgnoreCase(req.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên sản phẩm đã tồn tại: " + req.name());
        }

        BigDecimal normalizedPrice = req.price().setScale(2, RoundingMode.HALF_UP);

        Product entity = Product.builder()
                .name(req.name().trim())
                .price(normalizedPrice)
                .stockQuantity(req.stockQuantity())
                .image(req.image())
                .build();
        
        return repo.save(entity);
    }

    // --- LOGIC CHO UPDATE ---
    public Product updatePartial(Long id, ProductUpdateRequest req) {
        Product existing = getById(id);

        // Cập nhật tên
        if (req.name() != null && StringUtils.hasText(req.name())) {
            String newName = req.name().trim();
            // Nếu tên thay đổi và trùng với tên sản phẩm KHÁC -> Lỗi
            if (!newName.equalsIgnoreCase(existing.getName()) && repo.existsByNameIgnoreCase(newName)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên sản phẩm đã tồn tại: " + newName);
            }
            existing.setName(newName);
        }

        // Cập nhật giá
        if (req.price() != null) {
            BigDecimal normalized = req.price().setScale(2, RoundingMode.HALF_UP);
            if (normalized.compareTo(BigDecimal.valueOf(0.01)) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá phải lớn hơn 0");
            }
            existing.setPrice(normalized);
        }

        // Cập nhật tồn kho
        if (req.stockQuantity() != null) {
            if (req.stockQuantity() < 0) {
                 throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng tồn kho không thể âm");
            }
            existing.setStockQuantity(req.stockQuantity());
        }

        // Cập nhật ảnh
        if (req.image() != null) {
            existing.setImage(req.image());
        }

        return repo.save(existing);
    }

    // --- LOGIC CHO DELETE ---
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + id);
        }
        repo.deleteById(id);
    }
}