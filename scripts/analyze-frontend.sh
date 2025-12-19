#!/bin/bash
set -e

echo "--> [FRONTEND] Setup môi trường..."
# Cài JRE cho Sonar (vì image Node không có sẵn Java)
apt-get update -qq && apt-get install -y default-jre > /dev/null

cd services/frontend

echo "--> [FRONTEND] Cài đặt dependencies..."
npm ci --prefer-offline

echo "--> [FRONTEND] Chạy Unit Tests..."
npm test -- --coverage --watchAll=false --passWithNoTests

echo "--> [FRONTEND] Quét SonarQube..."
npx sonarqube-scanner \
    -Dsonar.projectKey=frontend-service \
    -Dsonar.sources=. \
    -Dsonar.exclusions=**/.next/**,**/node_modules/**,**/out/**,build/**,next-env.d.ts,**/*.test.ts,**/*.spec.ts \
    -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
    -Dsonar.css.allowUnknownAtRules=true

echo "--> [FRONTEND] Hoàn tất."