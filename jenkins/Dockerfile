# Bắt đầu từ image Jenkins chính thức với JDK 17
FROM jenkins/jenkins:lts-jdk17

# Chuyển sang user root để có quyền cài đặt
USER root

# Cài đặt tất cả các công cụ cần thiết trong một layer duy nhất để tối ưu hóa
RUN apt-get update && apt-get install -y \
    # --- Công cụ cơ bản ---
    git \
    curl \
    unzip \
    # --- Môi trường Python ---
    python3 \
    python3-venv \
    python3-pip \
    # --- Các gói phụ thuộc để cài Docker CLI ---
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Docker CLI (để Jenkins có thể gọi lệnh 'docker')
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && apt-get install -y docker-ce-cli

# Cài đặt Trivy (công cụ quét bảo mật)
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Chuyển về lại user jenkins để đảm bảo an toàn khi vận hành
USER jenkins