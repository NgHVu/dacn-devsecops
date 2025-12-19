#!/bin/bash
set -e # Dừng ngay nếu có lệnh bị lỗi

SERVICE_NAME=$1
SONAR_PROJECT_KEY="${SERVICE_NAME}-service"

echo "--> [BACKEND] Bắt đầu Test & Phân tích cho: $SERVICE_NAME"

# Chuyển vào thư mục service
cd "services/$SERVICE_NAME"

# Chạy Maven Verify & SonarQube
# Lưu ý: $SONAR_HOST_URL và $SONAR_AUTH_TOKEN sẽ được Jenkins tự bơm vào môi trường
mvn clean verify sonar:sonar \
    -Dsonar.projectKey=$SONAR_PROJECT_KEY \
    -Dmaven.test.failure.ignore=false

echo "--> [BACKEND] Hoàn tất phân tích Code Quality."