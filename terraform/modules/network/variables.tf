variable "project_name" { type = string }
variable "environment" { type = string } # dev, staging, prod
variable "vpc_cidr" { type = string }
variable "public_subnets_cidr" { type = list(string) }
variable "private_subnets_cidr" { type = list(string) }
variable "availability_zones" { type = list(string) }