#!/bin/bash
set -e

SERVICE_PATH="services/$1"
# Nếu tham số cache dir ($2) không được truyền vào hoặc rỗng, dùng cache mặc định trong workspace
CACHE_DIR="${2:-.trivy-cache}" 
SEVERITY=$3

echo "--> [SECURITY] Chuẩn bị thư mục Cache tại: $CACHE_DIR"
mkdir -p "$CACHE_DIR"

echo "--> [SECURITY] Bắt đầu quét mã nguồn tại: $SERVICE_PATH"

# Quét filesystem
# Thêm --scanners vuln,config,secret để quét toàn diện hơn
# Thêm --offline-scan nếu muốn (nhưng lần đầu cần online để tải DB)
trivy fs \
    --cache-dir "$CACHE_DIR" \
    --severity "$SEVERITY" \
    --scanners vuln,secret,config \
    --exit-code 0 \
    --no-progress \
    "$SERVICE_PATH"

echo "--> [SECURITY] Quét hoàn tất."