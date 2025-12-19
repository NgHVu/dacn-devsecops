# variables.tf
variable "aws_region" {
  description = "AWS Region để deploy resources"
  type        = string
  default     = "ap-southeast-1" # Singapore
}

variable "project_name" {
  description = "Tên dự án dùng để đặt prefix cho các resource"
  type        = string
  default     = "foodhub"
}

variable "ecr_repos" {
  description = "Danh sách các repositories cần tạo"
  type        = set(string)
  default     = ["foodhub-users", "foodhub-products", "foodhub-orders", "foodhub-frontend"]
}

variable "instance_type" {
  description = "Loại EC2 instance"
  type        = string
  default     = "t3.medium" # Khuyên dùng t3.medium cho Jenkins + SonarQube
}

variable "key_name" {
  description = "Tên Key Pair đã tạo trên AWS để SSH vào server"
  type        = string
}

variable "ami_id" {
  description = "AMI ID cho Ubuntu 22.04 (thay đổi tùy region)"
  type        = string
  default     = "ami-0672fd5b9210aa093" # Ubuntu 22.04 tại ap-southeast-1
}