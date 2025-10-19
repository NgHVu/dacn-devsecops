# ================================================================= #
# Giai đoạn 1: Base Image & ARGuments
# ================================================================= #
# TỐI ƯU 1: Nâng cấp lên JDK 21 để đồng bộ với môi trường build
FROM jenkins/jenkins:lts-jdk21

# TỐI ƯU 2: Sử dụng ARG để linh hoạt hóa phiên bản
ARG TRIVY_VERSION="0.49.1" # Kiểm tra phiên bản mới nhất tại GitHub của Trivy

# ================================================================= #
# Giai đoạn 2: Cài đặt với quyền Root
# ================================================================= #
USER root

# Cài đặt các công cụ điều phối cốt lõi
# Gộp các lệnh RUN để tối ưu layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    curl \
    unzip \
    ca-certificates \
    gnupg && \
    rm -rf /var/lib/apt/lists/*

# Cài đặt Docker CLI với phiên bản đã chỉ định
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y --no-install-recommends docker-ce-cli docker-buildx-plugin
     
# Cài đặt Trivy với phiên bản đã chỉ định
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v${TRIVY_VERSION}

# ================================================================= #
# Giai đoạn 3: Chuyển về user jenkins
# ================================================================= #
USER jenkins