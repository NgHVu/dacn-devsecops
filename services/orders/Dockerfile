# ================================================================= #
# Giai đoạn 1: Builder - Build ứng dụng bằng Maven
# ================================================================= #
# Sử dụng base image Maven với Java 21
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# 1. Copy file pom.xml và tải thư viện trước để tận dụng cache
COPY pom.xml .
RUN mvn dependency:go-offline

# 2. Copy toàn bộ mã nguồn và build file .jar
COPY src ./src
# Bỏ qua unit test ở bước này vì Jenkins sẽ chạy test ở một stage riêng
RUN mvn package -DskipTests

# 3. Trích xuất các "lớp" (layers) từ file .jar để Docker tối ưu hóa việc build image
RUN java -Djarmode=layertools -jar target/*.jar extract


# ================================================================= #
# Giai đoạn 2: Final - Image cuối cùng để chạy
# ================================================================= #
# Sử dụng image JRE (Runtime) 21 tối giản của Alpine
FROM eclipse-temurin:21-jre-alpine

# [SECURITY FIX] Cập nhật toàn bộ gói phần mềm trong Alpine để vá các lỗ hổng bảo mật (như libpng)
# Lệnh này giúp vá các CVE-2025-64720, CVE-2025-65018, CVE-2025-66293 mà Trivy đã phát hiện
RUN apk update && apk upgrade --no-cache

# Tạo user không có quyền root để vận hành container an toàn hơn
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Chuyển sang người dùng không có quyền root
USER appuser

# Sao chép các "lớp" đã được trích xuất từ giai đoạn builder
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

# Mở cổng 8083 (theo cấu hình của orders-service)
EXPOSE 8083

# Lệnh để khởi chạy ứng dụng (sử dụng JarLauncher của Spring Boot)
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]