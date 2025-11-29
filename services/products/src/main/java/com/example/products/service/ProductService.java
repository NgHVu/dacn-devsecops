package com.example.products.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification; 
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.example.products.dto.ProductCreateRequest;
import com.example.products.dto.ProductCriteria;
import com.example.products.dto.ProductUpdateRequest;
import com.example.products.entity.Category;
import com.example.products.entity.Product;
import com.example.products.repository.CategoryRepository;
import com.example.products.repository.ProductRepository;
import com.example.products.repository.ProductSpecification;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository repo;
    private final CategoryRepository categoryRepository; 

    @Transactional(readOnly = true)
    public Page<Product> getAllProducts(ProductCriteria criteria, Pageable pageable) {
        Specification<Product> spec = ProductSpecification.filterBy(criteria);

        Sort sort = Sort.by("updatedAt").descending();

        if (StringUtils.hasText(criteria.sort())) {
            switch (criteria.sort()) {
                case "price_asc" -> sort = Sort.by("price").ascending();
                case "price_desc" -> sort = Sort.by("price").descending();
                case "name_asc" -> sort = Sort.by("name").ascending();
                case "newest" -> sort = Sort.by("updatedAt").descending();
                default -> {
                    if (pageable.getSort().isSorted()) {
                        sort = pageable.getSort();
                    }
                }
            }
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
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

    public Product create(ProductCreateRequest req) {
        if (repo.existsByNameIgnoreCase(req.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên sản phẩm đã tồn tại: " + req.name());
        }

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy danh mục với ID: " + req.categoryId()));

        BigDecimal normalizedPrice = req.price().setScale(2, RoundingMode.HALF_UP);

        Product entity = Product.builder()
                .name(req.name().trim())
                .description(req.description()) 
                .price(normalizedPrice)
                .stockQuantity(req.stockQuantity())
                .image(req.image())
                .category(category) 
                .build();
        
        return repo.save(entity);
    }

    public Product updatePartial(Long id, ProductUpdateRequest req) {
        Product existing = getById(id);

        if (req.name() != null && StringUtils.hasText(req.name())) {
            String newName = req.name().trim();
            if (!newName.equalsIgnoreCase(existing.getName()) && repo.existsByNameIgnoreCase(newName)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên sản phẩm đã tồn tại: " + newName);
            }
            existing.setName(newName);
        }

        if (req.description() != null) {
            existing.setDescription(req.description());
        }

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

        if (req.image() != null) {
            existing.setImage(req.image());
        }

        if (req.categoryId() != null) {
            Category newCategory = categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy danh mục mới với ID: " + req.categoryId()));
            existing.setCategory(newCategory);
        }

        return repo.save(existing);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + id);
        }
        repo.deleteById(id);
    }
}