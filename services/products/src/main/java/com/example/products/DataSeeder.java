package com.example.products;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.example.products.entity.Category;
import com.example.products.entity.Product;
import com.example.products.repository.CategoryRepository;
import com.example.products.repository.ProductRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

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
        long existingProducts = productRepo.count();
        if (existingProducts > 0) {
            log.info("DataSeeder: phát hiện {} sản phẩm, bỏ qua seeding.", existingProducts);
            return;
        }

        log.info("DataSeeder: Bắt đầu tạo dữ liệu mẫu với tên món ăn hấp dẫn...");

        Category catMonHot = seedCategory("Món Hot", "Các món 'Best Seller' được yêu thích nhất", "Flame");
        Category catComTam = seedCategory("Cơm Tấm", "Cơm tấm Sài Gòn hạt vỡ chính hiệu", "Utensils");
        Category catBunPho = seedCategory("Bún Phở", "Hương vị truyền thống Việt Nam đậm đà", "Soup");
        Category catDoUong = seedCategory("Đồ Uống", "Trà sữa, Cà phê & Nước ép tươi", "Coffee");
        Category catPizza = seedCategory("Pizza", "Pizza Ý đế mỏng nướng củi", "Pizza");
        Category catBanhMi = seedCategory("Bánh Mì", "Bánh mì Việt Nam giòn rụm đẫm nhân", "Sandwich");
        Category catTrangMieng = seedCategory("Tráng Miệng", "Ngọt ngào sau bữa ăn", "IceCream");
        Category catDoNhau = seedCategory("Đồ Nhậu", "Mồi bén bia ngon lai rai", "Beer");

        List<Product> toInsert = new ArrayList<>();

        // Món Hot
        seedProduct(toInsert, "Gà Rán Sốt Cay Hàn Quốc", new BigDecimal("89000"), "https://i.pinimg.com/736x/7a/32/99/7a3299226f03908e3dbb8917e8b28a19.jpg", 100, catMonHot);
        seedProduct(toInsert, "Burger Bò Mỹ Phô Mai Tan Chảy", new BigDecimal("75000"), "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80", 50, catMonHot);
        seedProduct(toInsert, "Lẩu Thái Tomyum Hải Sản", new BigDecimal("250000"), "https://lacay.com.vn/thumbs/600x600x1/upload/product/lau-tomyum111-1754236693.jpg.webp", 30, catMonHot);
        seedProduct(toInsert, "Sườn Nướng Tảng Sốt BBQ", new BigDecimal("150000"), "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80", 40, catMonHot);
        seedProduct(toInsert, "Mì Ý Carbonara Kem Nấm", new BigDecimal("95000"), "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&q=80", 60, catMonHot);

        // Cơm Tấm
        seedProduct(toInsert, "Cơm Tấm Sườn Bì Chả Đặc Biệt", new BigDecimal("65000"), "https://i.pinimg.com/1200x/04/20/23/0420236e5b65b476bc78cdcb12b784f7.jpg", 100, catComTam);
        seedProduct(toInsert, "Cơm Sườn Cây Nướng Mật Ong", new BigDecimal("60000"), "https://i.pinimg.com/736x/d4/8f/d2/d48fd247b4a49c0323d316a2d59608b0.jpg", 80, catComTam);
        seedProduct(toInsert, "Cơm Ba Rọi Nướng Muối Ớt", new BigDecimal("55000"), "https://i.pinimg.com/1200x/42/c1/aa/42c1aacc7d6d42b68d9243d2cb43e627.jpg", 70, catComTam);
        seedProduct(toInsert, "Cơm Đùi Gà Góc Tư Xối Mỡ", new BigDecimal("50000"), "https://i.pinimg.com/1200x/f0/da/b7/f0dab7b828862eb2eb393eea634f99a9.jpg", 90, catComTam);
        seedProduct(toInsert, "Cơm Tấm Chả Cua Trứng Muối", new BigDecimal("68000"), "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzqBERke4IWemqxVWv82cYr_MUnN4x0dnchg&s", 60, catComTam);

        // Bún Phở
        seedProduct(toInsert, "Phở Bò Tái Nạm Gầu Gân", new BigDecimal("65000"), "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=80", 120, catBunPho);
        seedProduct(toInsert, "Bún Bò Huế Giò Heo", new BigDecimal("65000"), "https://i.pinimg.com/736x/f8/27/3e/f8273e52f64707906d1fee7eecfaa055.jpg", 80, catBunPho);
        seedProduct(toInsert, "Bún Chả Hà Nội", new BigDecimal("60000"), "https://i.pinimg.com/1200x/9f/ea/7c/9fea7c43fc9e228fa5b792695a23baa9.jpg", 75, catBunPho);
        seedProduct(toInsert, "Hủ Tiếu Nam Vang Tôm Mực", new BigDecimal("55000"), "https://i.pinimg.com/736x/6e/a6/25/6ea625b2d9ad6f8cf58f678468ff4a91.jpg", 90, catBunPho);
        seedProduct(toInsert, "Mì Quảng Ếch", new BigDecimal("55000"), "https://i.pinimg.com/1200x/70/fe/8c/70fe8c16083083c2e6a5e7da19cc9c3d.jpg", 60, catBunPho);

        // Đồ Uống
        seedProduct(toInsert, "Sữa Tươi Trân Châu Đường Đen", new BigDecimal("45000"), "https://api.nguyenlieutrendy.com/uploads/recipe_pictures/1616405063761-S%E1%BB%AFa%20t%C6%B0%C6%A1i%20tr%C3%A2n%20ch%C3%A2u%20%C4%91%C6%B0%E1%BB%9Dng%20%C4%91en%20RS.png", 200, catDoUong);
        seedProduct(toInsert, "Cà Phê Phin Sữa Đá Đậm Đà", new BigDecimal("29000"), "https://i.pinimg.com/1200x/2e/ff/e9/2effe9bb3cf81612599dc75a30fa1460.jpg", 150, catDoUong);
        seedProduct(toInsert, "Trà Đào Cam Sả Hạt Chia", new BigDecimal("45000"), "https://i.pinimg.com/1200x/2f/32/bf/2f32bfec4267f64d61649ce54b892e3e.jpg", 100, catDoUong);
        seedProduct(toInsert, "Sinh Tố Bơ Sáp Dừa Nạo", new BigDecimal("50000"), "https://www.huongnghiepaau.com/wp-content/uploads/2017/07/sinh-to-bo-dua-thom-beo.jpg", 80, catDoUong);
        seedProduct(toInsert, "Nước Ép Dưa Hấu Nguyên Chất", new BigDecimal("35000"), "https://i.pinimg.com/1200x/e9/ff/f6/e9fff6e0cd800b10e62e4de044ea12ca.jpg", 90, catDoUong);

        // Pizza
        seedProduct(toInsert, "Pizza Pepperoni Xúc Xích Cay", new BigDecimal("185000"), "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80", 50, catPizza);
        seedProduct(toInsert, "Pizza Hải Sản Pesto Xanh", new BigDecimal("220000"), "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80", 40, catPizza);
        seedProduct(toInsert, "Pizza 4 Loại Phô Mai Mật Ong", new BigDecimal("195000"), "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80", 45, catPizza);
        seedProduct(toInsert, "Pizza Dứa Giăm Bông Nhiệt Đới", new BigDecimal("175000"), "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80", 55, catPizza);
        seedProduct(toInsert, "Pizza Bò Băm Sốt Bolognese", new BigDecimal("195000"), "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80", 50, catPizza);

        // Bánh Mì
        seedProduct(toInsert, "Bánh Mì Heo Quay Giòn Bì", new BigDecimal("35000"), "https://mms.img.susercontent.com/vn-11134513-7r98o-lsvezxs1kjic85@resize_ss1242x600!@crop_w1242_h600_cT", 200, catBanhMi);
        seedProduct(toInsert, "Bánh Mì Chảo Bò Né Trứng Ốp", new BigDecimal("55000"), "https://i.pinimg.com/736x/22/73/39/22733958f6f5365a170d32b6f7760eaf.jpg", 100, catBanhMi);
        seedProduct(toInsert, "Bánh Mì Pate Gan Gà Đặc Biệt", new BigDecimal("25000"), "https://img-global.cpcdn.com/recipes/f176e333c1cdde03/680x781f0.484269_0.5_1.0q80/pate-gan-ga-v%E1%BB%9Bi-banh-mi-recipe-main-photo.jpg", 300, catBanhMi);
        seedProduct(toInsert, "Bánh Mì Gà Xé Sốt Bơ Tỏi", new BigDecimal("32000"), "https://i.pinimg.com/736x/1b/77/ff/1b77ffc3b7e988a2d6e0a84c81439e8f.jpg", 150, catBanhMi);
        seedProduct(toInsert, "Bánh Mì Que Pate Cay Hải Phòng", new BigDecimal("12000"), "https://i.pinimg.com/736x/0f/d0/e0/0fd0e0bcdbcfc382fd35099c2d8cb862.jpg", 500, catBanhMi);

        // Tráng Miệng
        seedProduct(toInsert, "Kem Gelato Dâu Tây Tươi", new BigDecimal("45000"), "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&q=80", 100, catTrangMieng);
        seedProduct(toInsert, "Bánh Flan Cốt Dừa Cà Phê", new BigDecimal("18000"), "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=500&q=80", 150, catTrangMieng);
        seedProduct(toInsert, "Chè Thái Sầu Riêng Full Topping", new BigDecimal("40000"), "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80", 80, catTrangMieng);
        seedProduct(toInsert, "Sữa Chua Hy Lạp Mix Trái Cây", new BigDecimal("35000"), "https://cdn.nhathuoclongchau.com.vn/unsafe/800x0/tu_tay_lam_bua_nhe_ngon_tuyet_voi_sua_chua_hy_lap_mix_trai_cay_chuan_healthy_3_5a0de43a76.jpeg", 90, catTrangMieng);
        seedProduct(toInsert, "Bánh Tiramisu Cacao", new BigDecimal("60000"), "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80", 60, catTrangMieng);

        // Đồ Nhậu
        seedProduct(toInsert, "Chân Gà Rút Xương Ngâm Sả Tắc", new BigDecimal("75000"), "https://i.pinimg.com/1200x/1b/8b/32/1b8b3271303bbfe0cb091522df4d20cc.jpg", 100, catDoNhau);
        seedProduct(toInsert, "Khô Mực Nướng", new BigDecimal("160000"), "https://i.pinimg.com/736x/e5/88/bb/e588bbd11bc36f338e133cee13e4582c.jpg", 50, catDoNhau);
        seedProduct(toInsert, "Mẹt Nem Chua Rán Phố Cổ", new BigDecimal("65000"), "https://i.pinimg.com/1200x/aa/95/96/aa959690c55dfb4600b4db9bf5539e04.jpg", 120, catDoNhau);
        seedProduct(toInsert, "Đậu Phộng Rang Tỏi Ớt", new BigDecimal("25000"), "https://i.pinimg.com/1200x/fe/f9/b0/fef9b03a58536964a575fecb32ab2cab.jpg", 300, catDoNhau);
        seedProduct(toInsert, "Bia Thủ Công Lạnh", new BigDecimal("65000"), "https://cdn2.fptshop.com.vn/unsafe/768x0/filters:format(webp):quality(75)/2024_1_27_638419868208634521_bia-thu-cong-1.jpg", 200, catDoNhau);

        if (!toInsert.isEmpty()) {
            productRepo.saveAll(toInsert);
            log.info("DataSeeder: Đã thêm {} sản phẩm mẫu thành công.", toInsert.size());
        }
    }

    private Category seedCategory(String name, String description, String icon) {
        return categoryRepo.findAll().stream()
                .filter(c -> c.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> categoryRepo.save(Category.builder()
                        .name(name)
                        .description(description)
                        .icon(icon) 
                        .build()));
    }

    private void seedProduct(List<Product> buffer, String name, BigDecimal price, String imageUrl, Integer stock, Category category) {
        if (productRepo.existsByNameIgnoreCase(name)) {
            log.debug("Bỏ qua sản phẩm (đã tồn tại): {}", name);
            return;
        }
        buffer.add(Product.builder()
                .name(name)
                .price(price)
                .image(imageUrl)
                .stockQuantity(stock)
                .category(category)
                .build());
    }
}