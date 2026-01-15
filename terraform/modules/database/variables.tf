variable "project_name" { type = string }
variable "environment" { type = string }

# Nhận từ Module Network
variable "private_subnet_ids" { type = list(string) }

# Nhận từ Module Security
variable "rds_sg_id" { type = string }

# Thông tin Database (Sẽ khai báo trong tfvars sau này để bảo mật)
variable "db_password" { type = string }
variable "db_username" { 
  type    = string 
  default = "foodhub_admin"
}