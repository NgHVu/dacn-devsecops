package com.example.products.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification; 
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.example.products.dto.ProductCreateRequest;
import com.example.products.dto.ProductUpdateRequest;
import com.example.products.entity.Product;
import com.example.products.repository.ProductRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service // Đánh dấu đây là một Service Bean
@RequiredArgsConstructor // (Lombok) Tự động tạo constructor để tiêm Repository
@Transactional // Mặc định các phương thức sẽ là transaction
public class ProductService {

    // Tiêm Repository vào Service
    private final ProductRepository repo;

    // --- LOGIC CHO READ ---
    @Transactional(readOnly = true)
    public Page<Product> list(String q, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        
        // 1. Tạo một Specification rỗng (luôn đúng) để bắt đầu
        Specification<Product> spec = Specification.allOf();

        // 2. Nếu có từ khóa tên, thêm điều kiện "AND name LIKE ..."
        if (StringUtils.hasText(q)) {
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("name")), "%" + q.trim().toLowerCase() + "%")
            );
        }

        // 3. Nếu có khoảng giá, thêm điều kiện "AND price BETWEEN ..."
        if (minPrice != null && maxPrice != null) {
            if (minPrice.compareTo(maxPrice) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minPrice không được lớn hơn maxPrice");
            }
            spec = spec.and((root, query, cb) -> 
                cb.between(root.get("price"), minPrice, maxPrice)
            );
        }

        // 4. Thực thi truy vấn với tất cả các điều kiện đã được xây dựng
        return repo.findAll(spec, pageable);
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
        Product existing = getById(id); // Tái sử dụng logic getById (đã bao gồm check Not Found)

        // Cập nhật tên
        if (req.name() != null && StringUtils.hasText(req.name())) {
            String newName = req.name().trim();
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