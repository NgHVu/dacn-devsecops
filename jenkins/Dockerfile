# Jenkins LTS (Debian trixie)
FROM jenkins/jenkins:lts-jdk17

# Become root to install packages
USER root

# Base tools + Python 3 (use distro default: 3.12 on trixie)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    ca-certificates \
    gnupg \
    python3 \
    python3-venv \
    python3-dev \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# Make sure "python" exists and points to python3 (optional)
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Docker CLI (to build images from inside Jenkins)
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list && \
    apt-get update && apt-get install -y docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

# Trivy (single binary)
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Back to jenkins user
USER jenkins
