package com.example.products;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.example.products.entity.Product;
import com.example.products.repository.ProductRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(10) // chạy sớm nhưng sau khi JPA sẵn sàng
@Profile({"dev", "local"}) // chỉ seed trong dev/local
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository repo;

    @Override
    @Transactional
    public void run(String... args) {
        long existing = repo.count();
        if (existing > 0) {
            log.info("DataSeeder: phát hiện {} bản ghi, bỏ qua seeding.", existing);
            return;
        }

        List<Product> toInsert = new ArrayList<>();

        seedIfAbsent(toInsert, "Cơm Tấm Sườn Bì Chả", new BigDecimal("55000.00"), "com-tam.jpg");
        seedIfAbsent(toInsert, "Phở Bò Tái Nạm",     new BigDecimal("50000.00"), "pho-bo.jpg");
        seedIfAbsent(toInsert, "Bún Bò Huế",         new BigDecimal("45000.00"), "bun-bo-hue.jpg");

        if (!toInsert.isEmpty()) {
            repo.saveAll(toInsert);
            log.info("DataSeeder: đã thêm {} sản phẩm mẫu.", toInsert.size());
        } else {
            log.info("DataSeeder: không có dữ liệu cần thêm.");
        }
    }

    private void seedIfAbsent(List<Product> buffer, String name, BigDecimal price, String image) {
        if (repo.existsByNameIgnoreCase(name)) {
            log.debug("Bỏ qua (đã tồn tại): {}", name);
            return;
        }
        buffer.add(Product.builder()
                .name(name)
                .price(price)
                .image(image)
                .build());
    }
}
