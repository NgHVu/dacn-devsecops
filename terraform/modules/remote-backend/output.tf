output "s3_bucket_name" {
  value       = aws_s3_bucket.terraform_state.id
  description = "Tên S3 Bucket lưu trữ Terraform State"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.terraform_locks.name
  description = "Tên DynamoDB Table dùng để Lock State"
}