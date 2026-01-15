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
  default     = "dev"
  description = "Môi trường triển khai: dev, staging, prod"
}

variable "instance_type" {
  type    = string
  default = "t3.medium"
}

variable "key_name" {
  type        = string
  description = "Tên Key Pair đã có trên AWS"
}

variable "ami_id" {
  type    = string
  default = "ami-0672fd5b9210aa093"
}

variable "ecr_repos" {
  type    = set(string)
  default = ["foodhub-users", "foodhub-products", "foodhub-orders", "foodhub-frontend"]
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Mật khẩu cho RDS Database admin"
}

variable "slack_webhook_url" {
  type      = string
  sensitive = true
  default   = "" # Sẽ nhập trong terraform.tfvars
}