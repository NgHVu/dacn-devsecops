#!/bin/bash
set -e

SERVICE_PATH="services/$1"
CACHE_DIR="${2:-.trivy-cache}" 
SEVERITY=$3

echo "--> [SECURITY] Chuẩn bị thư mục Cache tại: $CACHE_DIR"
mkdir -p "$CACHE_DIR"

echo "--> [SECURITY] Bắt đầu quét mã nguồn tại: $SERVICE_PATH"

# Quét filesystem
trivy fs \
    --cache-dir "$CACHE_DIR" \
    --severity "$SEVERITY" \
    --scanners vuln,secret,config \
    --exit-code 0 \
    --no-progress \
    "$SERVICE_PATH"

echo "--> [SECURITY] Quét hoàn tất."