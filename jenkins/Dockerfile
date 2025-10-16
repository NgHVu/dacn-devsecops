# Bắt đầu từ image Jenkins chính thức với JDK 17
FROM jenkins/jenkins:lts-jdk17

# Chuyển sang user root để có quyền cài đặt
USER root

# Cài đặt các công cụ CẦN THIẾT cho các stage khác
# --- ĐÃ LOẠI BỎ PYTHON RA KHỎI ĐÂY ---
RUN apt-get update && apt-get install -y \
    # --- Công cụ cơ bản ---
    git \
    curl \
    unzip \
    # --- Các gói phụ thuộc để cài Docker CLI ---
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Docker CLI (Giữ nguyên, vì các stage Build/Scan vẫn cần)
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && apt-get install -y docker-ce-cli

# Cài đặt Trivy (Giữ nguyên, vì stage Scan vẫn cần)
RUN curl -sfL https://raw.githubusercontent.com/aquasecurit