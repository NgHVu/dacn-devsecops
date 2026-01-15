# Tạo DynamoDB Table để khóa State (Locking)
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "${var.project_name}-${var.environment}-tf-locks"
  billing_mode = "PAY_PER_REQUEST" # Tiết kiệm tiền, dùng bao nhiêu trả bấy nhiêu
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "Terraform State Lock Table"
    Environment = var.environment
  }
}