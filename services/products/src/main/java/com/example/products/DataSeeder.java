package com.example.products;

import com.example.products.entity.Category;
import com.example.products.entity.Product;
import com.example.products.repository.CategoryRepository;
import com.example.products.repository.ProductRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.ExampleMatcher;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(10)
@Profile({"dev", "local"})
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;

    @Override
    @Transactional
    public void run(String... args) {
        if (isDataSeeded()) {
            return;
        }

        log.info("DataSeeder: Bắt đầu khởi tạo dữ liệu mẫu...");

        // 1. Seed Categories
        Category catMonHot = seedCategory("Món Hot", "Các món 'Best Seller' được yêu thích nhất", "Flame");
        Category catComTam = seedCategory("Cơm Tấm", "Cơm tấm Sài Gòn hạt vỡ chính hiệu", "Utensils");
        Category catBunPho = seedCategory("Bún Phở", "Hương vị truyền thống Việt Nam đậm đà", "Soup");
        Category catDoUong = seedCategory("Đồ Uống", "Trà sữa, Cà phê & Nước ép tươi", "Coffee");
        Category catPizza = seedCategory("Pizza", "Pizza Ý đế mỏng nướng củi", "Pizza");
        Category catBanhMi = seedCategory("Bánh Mì", "Bánh mì Việt Nam giòn rụm đẫm nhân", "Sandwich");
        Category catTrangMieng = seedCategory("Tráng Miệng", "Ngọt ngào sau bữa ăn", "IceCream");
        Category catDoNhau = seedCategory("Đồ Nhậu", "Mồi bén bia ngon lai rai", "Beer");

        List<Product> productsToSave = new ArrayList<>();

        // 2. Seed Products by Group
        addMonHot(productsToSave, catMonHot);
        addComTam(productsToSave, catComTam);
        addBunPho(productsToSave, catBunPho);
        addDoUong(productsToSave, catDoUong);
        addPizza(productsToSave, catPizza);
        addBanhMi(productsToSave, catBanhMi);
        addTrangMieng(productsToSave, catTrangMieng);
        addDoNhau(productsToSave, catDoNhau);

        // 3. Batch Save
        saveProductsBatch(productsToSave);
    }

    private boolean isDataSeeded() {
        long existingProducts = productRepo.count();
        if (existingProducts > 0) {
            log.info("DataSeeder: Hệ thống đã có {} sản phẩm. Bỏ qua seeding.", existingProducts);
            return true;
        }
        return false;
    }

    private void saveProductsBatch(List<Product> products) {
        if (!products.isEmpty()) {
            productRepo.saveAll(products);
            log.info("DataSeeder: Đã thêm thành công {} sản phẩm.", products.size());
        }
    }

    /**
     * Tối ưu hóa việc tìm kiếm Category:
     * Thay vì dùng findAll() (Load ALL rows) -> stream filter (Memory),
     * Sử dụng Query By Example (Database query) hiệu quả hơn.
     */
    private Category seedCategory(String name, String description, String icon) {
        Category probe = Category.builder().name(name).build();
        ExampleMatcher matcher = ExampleMatcher.matching()
                .withIgnoreCase()
                .withIgnorePaths("id", "description", "icon", "audit"); // Ignore other fields

        Optional<Category> existing = categoryRepo.findOne(Example.of(probe, matcher));

        return existing.orElseGet(() -> categoryRepo.save(Category.builder()
                .name(name)
                .description(description)
                .icon(icon)
                .build()));
    }

    private void addProduct(List<Product> buffer, String name, String priceStr, String imageUrl, Integer stock, Category category) {
        if (productRepo.existsByNameIgnoreCase(name)) {
            log.debug("Skip existing product: {}", name);
            return;
        }
        buffer.add(Product.builder()
                .name(name)
                .price(new BigDecimal(priceStr))
                .image(imageUrl)
                .stockQuantity(stock)
                .category(category)
                // Các giá trị mặc định cho rating nên được set trong @PrePersist của Entity hoặc BuilderDefault
                .averageRating(0.0)
                .reviewCount(0)
                .build());
    }

    // --- Helper Methods to breakdown the large run method ---

    private void addMonHot(List<Product> list, Category cat) {
        addProduct(list, "Gà Rán Sốt Cay Hàn Quốc", "89000", "https://i.pinimg.com/736x/7a/32/99/7a3299226f03908e3dbb8917e8b28a19.jpg", 100, cat);
        addProduct(list, "Burger Bò Mỹ Phô Mai Tan Chảy", "75000", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80", 50, cat);
        addProduct(list, "Lẩu Thái Tomyum Hải Sản", "250000", "https://lacay.com.vn/thumbs/600x600x1/upload/product/lau-tomyum111-1754236693.jpg.webp", 30, cat);
        addProduct(list, "Sườn Nướng Tảng Sốt BBQ", "150000", "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80", 40, cat);
        addProduct(list, "Mì Ý Carbonara Kem Nấm", "95000", "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&q=80", 60, cat);
    }

    private void addComTam(List<Product> list, Category cat) {
        addProduct(list, "Cơm Tấm Sườn Bì Chả Đặc Biệt", "65000", "https://i.pinimg.com/1200x/04/20/23/0420236e5b65b476bc78cdcb12b784f7.jpg", 100, cat);
        addProduct(list, "Cơm Sườn Cây Nướng Mật Ong", "60000", "https://i.pinimg.com/736x/d4/8f/d2/d48fd247b4a49c0323d316a2d59608b0.jpg", 80, cat);
        addProduct(list, "Cơm Ba Rọi Nướng Muối Ớt", "55000", "https://i.pinimg.com/1200x/42/c1/aa/42c1aacc7d6d42b68d9243d2cb43e627.jpg", 70, cat);
        addProduct(list, "Cơm Đùi Gà Góc Tư Xối Mỡ", "50000", "https://i.pinimg.com/1200x/f0/da/b7/f0dab7b828862eb2eb393eea634f99a9.jpg", 90, cat);
        addProduct(list, "Cơm Tấm Chả Cua Trứng Muối", "68000", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzqBERke4IWemqxVWv82cYr_MUnN4x0dnchg&s", 60, cat);
    }

    private void addBunPho(List<Product> list, Category cat) {
        addProduct(list, "Phở Bò Tái Nạm Gầu Gân", "65000", "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80", 120, cat);
        addProduct(list, "Bún Bò Huế Giò Heo", "65000", "https://i.pinimg.com/736x/f8/27/3e/f8273e52f64707906d1fee7eecfaa055.jpg", 80, cat);
        addProduct(list, "Bún Chả Hà Nội", "60000", "https://i.pinimg.com/1200x/9f/ea/7c/9fea7c43fc9e228fa5b792695a23baa9.jpg", 75, cat);
        addProduct(list, "Hủ Tiếu Nam Vang Tôm Mực", "55000", "https://i.pinimg.com/736x/6e/a6/25/6ea625b2d9ad6f8cf58f678468ff4a91.jpg", 90, cat);
        addProduct(list, "Mì Quảng Ếch", "55000", "https://i.pinimg.com/1200x/70/fe/8c/70fe8c16083083c2e6a5e7da19cc9c3d.jpg", 60, cat);
    }

    private void addDoUong(List<Product> list, Category cat) {
        addProduct(list, "Sữa Tươi Trân Châu Đường Đen", "45000", "https://api.nguyenlieutrendy.com/uploads/recipe_pictures/1616405063761-S%E1%BB%AFa%20t%C6%B0%C6%A1i%20tr%C3%A2n%20ch%C3%A2u%20%C4%91%C6%B0%E1%BB%9Dng%20%C4%91en%20RS.png", 200, cat);
        addProduct(list, "Cà Phê Phin Sữa Đá Đậm Đà", "29000", "https://i.pinimg.com/1200x/2e/ff/e9/2effe9bb3cf81612599dc75a30fa1460.jpg", 150, cat);
        addProduct(list, "Trà Đào Cam Sả Hạt Chia", "45000", "https://i.pinimg.com/1200x/2f/32/bf/2f32bfec4267f64d61649ce54b892e3e.jpg", 100, cat);
        addProduct(list, "Sinh Tố Bơ Sáp Dừa Nạo", "50000", "https://www.huongnghiepaau.com/wp-content/uploads/2017/07/sinh-to-bo-dua-thom-beo.jpg", 80, cat);
        addProduct(list, "Nước Ép Dưa Hấu Nguyên Chất", "35000", "https://i.pinimg.com/1200x/e9/ff/f6/e9fff6e0cd800b10e62e4de044ea12ca.jpg", 90, cat);
    }

    private void addPizza(List<Product> list, Category cat) {
        addProduct(list, "Pizza Pepperoni Xúc Xích Cay", "185000", "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80", 50, cat);
        addProduct(list, "Pizza Hải Sản Pesto Xanh", "220000", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80", 40, cat);
        addProduct(list, "Pizza 4 Loại Phô Mai Mật Ong", "195000", "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80", 45, cat);
        addProduct(list, "Pizza Dứa Giăm Bông Nhiệt Đới", "175000", "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80", 55, cat);
        addProduct(list, "Pizza Bò Băm Sốt Bolognese", "195000", "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80", 50, cat);
    }

    private void addBanhMi(List<Product> list, Category cat) {
        addProduct(list, "Bánh Mì Heo Quay Giòn Bì", "35000", "https://mms.img.susercontent.com/vn-11134513-7r98o-lsvezxs1kjic85@resize_ss1242x600!@crop_w1242_h600_cT", 200, cat);
        addProduct(list, "Bánh Mì Chảo Bò Né Trứng Ốp", "55000", "https://i.pinimg.com/736x/22/73/39/22733958f6f5365a170d32b6f7760eaf.jpg", 100, cat);
        addProduct(list, "Bánh Mì Pate Gan Gà Đặc Biệt", "25000", "https://img-global.cpcdn.com/recipes/f176e333c1cdde03/680x781f0.484269_0.5_1.0q80/pate-gan-ga-v%E1%BB%9Bi-banh-mi-recipe-main-photo.jpg", 300, cat);
        addProduct(list, "Bánh Mì Gà Xé Sốt Bơ Tỏi", "32000", "https://i.pinimg.com/736x/1b/77/ff/1b77ffc3b7e988a2d6e0a84c81439e8f.jpg", 150, cat);
        addProduct(list, "Bánh Mì Que Pate Cay Hải Phòng", "12000", "https://i.pinimg.com/736x/0f/d0/e0/0fd0e0bcdbcfc382fd35099c2d8cb862.jpg", 500, cat);
    }

    private void addTrangMieng(List<Product> list, Category cat) {
        addProduct(list, "Kem Gelato Dâu Tây Tươi", "45000", "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&q=80", 100, cat);
        addProduct(list, "Bánh Flan Cốt Dừa Cà Phê", "18000", "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=500&q=80", 150, cat);
        addProduct(list, "Chè Thái Sầu Riêng Full Topping", "40000", "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80", 80, cat);
        addProduct(list, "Sữa Chua Hy Lạp Mix Trái Cây", "35000", "https://cdn.nhathuoclongchau.com.vn/unsafe/800x0/tu_tay_lam_bua_nhe_ngon_tuyet_voi_sua_chua_hy_lap_mix_trai_cay_chuan_healthy_3_5a0de43a76.jpeg", 90, cat);
        addProduct(list, "Bánh Tiramisu Cacao", "60000", "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80", 60, cat);
    }

    private void addDoNhau(List<Product> list, Category cat) {
        addProduct(list, "Chân Gà Rút Xương Ngâm Sả Tắc", "75000", "https://i.pinimg.com/1200x/1b/8b/32/1b8b3271303bbfe0cb091522df4d20cc.jpg", 100, cat);
        addProduct(list, "Khô Mực Nướng", "160000", "https://i.pinimg.com/736x/e5/88/bb/e588bbd11bc36f338e133cee13e4582c.jpg", 50, cat);
        addProduct(list, "Mẹt Nem Chua Rán Phố Cổ", "65000", "https://i.pinimg.com/1200x/aa/95/96/aa959690c55dfb4600b4db9bf5539e04.jpg", 120, cat);
        addProduct(list, "Đậu Phộng Rang Tỏi Ớt", "25000", "https://i.pinimg.com/1200x/fe/f9/b0/fef9b03a58536964a575fecb32ab2cab.jpg", 300, cat);
        addProduct(list, "Bia Thủ Công Lạnh", "65000", "https://cdn2.fptshop.com.vn/unsafe/768x0/filters:format(webp):quality(75)/2024_1_27_638419868208634521_bia-thu-cong-1.jpg", 200, cat);
    }
}