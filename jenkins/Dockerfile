# Bắt đầu từ image Jenkins chính thức với JDK 17
FROM jenkins/jenkins:lts-jdk17

# Chuyển sang user root để cài đặt
USER root

# Cài đặt các công cụ cơ bản và các gói phụ thuộc cho Python
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    ca-certificates \
    gnupg \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Thêm PPA deadsnakes để cài đặt các phiên bản Python cũ hơn
RUN add-apt-repository ppa:deadsnakes/ppa -y

# Cài đặt Python 3.11 và các công cụ cần thiết để build C extensions
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

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

# Chuyển về lại user jenkins
USER jenkins