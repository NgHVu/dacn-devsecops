variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "project_name" {
  type    = string
  default = "foodhub"
}

variable "environment" {
  type        = string
  default     = "prod" # Đã sửa thành Prod
  description = "Môi trường triển khai: dev, staging, prod"
}

variable "instance_type" {
  type    = string
  default = "t3.medium" # Instance cho EKS Node
}

variable "key_name" {
  type        = string
  default     = "foodhub-key" # Đặt mặc định luôn cho tiện
  description = "Tên Key Pair đã có trên AWS"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Mật khẩu cho RDS Database admin"
}

variable "slack_webhook_url" {
  type      = string
  sensitive = true
  default   = ""
}