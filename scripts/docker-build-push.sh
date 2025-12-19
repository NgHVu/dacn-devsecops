#!/bin/bash
set -e

SERVICE_NAME=$1
IMAGE_URI=$2
IMAGE_TAG=$3

echo "--> [DOCKER] Building $SERVICE_NAME..."

cd "services/$SERVICE_NAME"

# Build (gắn 2 tag: commit-hash và latest)
docker build -t "$IMAGE_URI:$IMAGE_TAG" -t "$IMAGE_URI:latest" .

echo "--> [DOCKER] Pushing to ECR..."
docker push "$IMAGE_URI:$IMAGE_TAG"
docker push "$IMAGE_URI:latest"

echo "--> [DOCKER] Thành công! Image: $IMAGE_URI:$IMAGE_TAG"