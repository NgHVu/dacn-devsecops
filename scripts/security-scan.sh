#!/bin/bash
set -e

SERVICE_PATH="services/$1"
CACHE_DIR=$2
SEVERITY=$3

echo "--> [SECURITY] Quét mã nguồn tại: $SERVICE_PATH"

# Quét filesystem
trivy fs \
    --cache-dir "$CACHE_DIR" \
    --severity "$SEVERITY" \
    --exit-code 0 \
    --no-progress \
    "$SERVICE_PATH"

echo "--> [SECURITY] Quét hoàn tất."