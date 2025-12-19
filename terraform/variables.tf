variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "project_name" {
  type    = string
  default = "foodhub"
}

variable "instance_type" {
  type    = string
  default = "t3.medium" # Jenkins + SonarQube cần tối thiểu 4GB RAM
}

variable "key_name" {
  type        = string
  description = "Tên Key Pair đã có trên AWS"
}

variable "ami_id" {
  type    = string
  default = "ami-0672fd5b9210aa093" # Ubuntu 22.04 LTS ap-southeast-1
}

variable "ecr_repos" {
  type    = set(string)
  default = ["foodhub-users", "foodhub-products", "foodhub-orders", "foodhub-frontend"]
}