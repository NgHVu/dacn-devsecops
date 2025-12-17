# Khai báo provider nếu chưa có trong main.tf (nếu có rồi thì bỏ qua block provider)
provider "aws" {
  region = "us-east-1" #"ap-southeast-1" Singapore
}

# 1. Repository cho Products Service
resource "aws_ecr_repository" "products" {
  name                 = "foodhub-products"
  image_tag_mutability = "MUTABLE"
  force_delete         = true # Cho phép xóa repo dù còn image (tiện cho lab/dev)

  image_scanning_configuration {
    scan_on_push = true # Tự động scan bảo mật khi push lên
  }
}

# 2. Repository cho Users Service
resource "aws_ecr_repository" "users" {
  name                 = "foodhub-users"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# 3. Repository cho Orders Service
resource "aws_ecr_repository" "orders" {
  name                 = "foodhub-orders"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Output ra URL để bạn copy vào Jenkins sau này
output "ecr_repository_urls" {
  value = {
    products = aws_ecr_repository.products.repository_url
    users    = aws_ecr_repository.users.repository_url
    orders   = aws_ecr_repository.orders.repository_url
  }
}