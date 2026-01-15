# 1. Tạo S3 Bucket để lưu file State
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-${var.environment}-tfstate"
  
  # Ngăn chặn xóa nhầm bucket nếu còn dữ liệu
  # Trong môi trường thực tế nên để false để an toàn, nhưng lab thì true cho tiện
  force_destroy = true 

  tags = {
    Name        = "Terraform State Storage"
    Environment = var.environment
  }
}

# 2. Bật tính năng Versioning (Quan trọng: Để rollback nếu file state bị lỗi)
resource "aws_s3_bucket_versioning" "enabled" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# 3. Bật mã hóa dữ liệu (Server Side Encryption)
resource "aws_s3_bucket_server_side_encryption_configuration" "default" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 4. Chặn truy cập công khai (Public Access) hoàn toàn
resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}