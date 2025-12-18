# ================================================================= #
# Giai đoạn 1: Builder - Build ứng dụng bằng Maven
# ================================================================= #
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# 1. Copy file pom.xml và tải thư viện trước để tận dụng cache
COPY pom.xml .
RUN mvn dependency:go-offline

# 2. Copy toàn bộ mã nguồn và build file .jar
COPY src ./src
RUN mvn package -DskipTests

# 3. Trích xuất các "lớp" (layers) từ file .jar để Docker tối ưu hóa
RUN java -Djarmode=layertools -jar target/*.jar extract


# ================================================================= #
# Giai đoạn 2: Final - Image cuối cùng để chạy
# ================================================================= #
FROM eclipse-temurin:21-jre-alpine

# [SECURITY FIX] Cập nhật toàn bộ gói phần mềm trong Alpine để vá lỗ hổng
# Lệnh này sẽ nâng cấp libpng từ 1.6.47-r0 lên bản vá mới nhất (1.6.53-r0) theo yêu cầu của Trivy
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

# Mở cổng 8082 (theo yêu cầu cấu hình mới của users-service)
EXPOSE 8082

# Lệnh khởi chạy ứng dụng
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]