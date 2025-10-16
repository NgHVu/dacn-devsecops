# Bắt đầu từ image Jenkins chính thức với JDK 17
FROM jenkins/jenkins:lts-jdk17

# Chuyển sang user root để có quyền cài đặt
USER root

# Cài đặt tất cả các công cụ cần thiết trong MỘT layer duy nhất để tối ưu hóa
RUN apt-get update && apt-get install -y \
    # --- Công cụ cơ bản ---
    git \
    curl \
    unzip \
    # --- Môi trường Python (Cài trực tiếp phiên bản 3.11) ---
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    build-essential \
    # --- Các gói phụ thuộc để cài Docker CLI ---
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Tạo symlink (đường dẫn tắt) để lệnh `python3` trỏ đến `python3.11`
RUN ln -s /usr/bin/python3.11 /usr/bin/python3

# Cài đặt Docker CLI (Giữ nguyên)
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && apt-get install -y docker-ce-cli

# Cài đặt Trivy (Giữ nguyên)
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Chuyển về lại user jenkins để đảm bảo an toàn khi vận hành
USER jenkins