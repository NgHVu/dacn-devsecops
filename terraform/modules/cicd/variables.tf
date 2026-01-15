variable "project_name" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "subnet_id" { type = string } # Public Subnet
variable "security_group_ids" { type = list(string) }
variable "ami_id" { type = string }
variable "instance_type" { type = string }
variable "key_name" { type = string }