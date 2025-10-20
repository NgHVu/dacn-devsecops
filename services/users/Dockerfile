# ================================================================= #
# Giai đoạn 1: Builder - Build ứng dụng bằng Maven
# ================================================================= #
# Sử dụng base image Maven với Java 21 (Temurin là bản build OpenJDK)
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# 1. Copy file pom.xml và tải thư viện trước để tận dụng cache
COPY pom.xml .
RUN mvn dependency:go-offline

# 2. Copy toàn bộ mã nguồn và build file .jar
COPY src ./src
# -DskipTests để bỏ qua unit test (vì Jenkinsfile sẽ chạy test ở stage riêng)
RUN mvn package -DskipTests

# 3. Trích xuất các "lớp" (layers) từ file .jar để Docker tối ưu hóa
RUN java -Djarmode=layertools -jar target/*.jar extract


# ================================================================= #
# Giai đoạn 2: Final - Image cuối cùng để chạy
# ================================================================= #
# Sử dụng image JRE (Runtime) 21 tối giản của Alpine
FROM eclipse-temurin:21-jre-alpine

# Tạo user không có quyền root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Chuyển sang người dùng không có quyền root
USER appuser

# Sao chép các "lớp" đã được trích xuất (thứ tự này rất quan trọng)
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

# Mở cổng 8082 (theo file application.properties của users-service)
EXPOSE 8082

# Lệnh để khởi chạy ứng dụng (sử dụng trình khởi chạy của Spring)
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
