# Bắt đầu từ image Jenkins chính thức với JDK 17
FROM jenkins/jenkins:lts-jdk17

# Chuyển sang user root để có quyền cài đặt
USER root

# Cài đặt các gói phụ thuộc để có thể thêm PPA
RUN apt-get update && apt-get install -y \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Thêm PPA "deadsnakes", đây là kho chứa các phiên bản Python phổ biến
RUN add-apt-repository ppa:deadsnakes/ppa -y

# Cập nhật lại danh sách gói sau khi thêm PPA và cài đặt tất cả công cụ
RUN apt-get update && apt-get install -y \
    # --- Công cụ cơ bản ---
    git \
    curl \
    unzip \
    ca-certificates \
    gnupg \
    # --- Môi trường Python (Giờ đây apt-get đã có thể tìm thấy) ---
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Tạo symlink (đường dẫn tắt) để lệnh `python3` trỏ đến `python3.11`
# Giúp các script gọi `python3` một cách nhất quán
RUN ln -sf /usr/bin/python3.11 /usr/bin/python3

# Cài đặt Docker CLI
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && apt-get install -y docker-ce-cli

# Cài đặt Trivy
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Chuyển về lại user jenkins để đảm bảo an toàn
USER jenkins