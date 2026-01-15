terraform {
  required_providers {
    postgresql = {
      source = "cyrilgdn/postgresql"
    }
  }
}

# 1. Subnet Group (Đặt DB vào Private Subnet)
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = { Name = "${var.project_name}-${var.environment}-db-subnet-group" }
}

# 2. RDS Instance (Hạ tầng vật lý)
resource "aws_db_instance" "postgres" {
  identifier        = "${var.project_name}-${var.environment}-db"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  engine            = "postgres"
  engine_version    = "16.11" # Giữ version bạn chọn
  
  username          = var.db_username
  password          = var.db_password
  db_name           = "postgres" # DB mặc định ban đầu để connect
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_sg_id]
  
  # Quan trọng: Để Private để bảo mật. 
  # Lưu ý: Để Terraform tạo được Logical DB bên dưới, máy chạy Terraform 
  # phải kết nối được vào VPC (qua VPN) hoặc chạy trên Runner trong K8s.
  # Nếu bạn chạy local mà không có VPN, tạm thời có thể để true (nhưng không khuyến khích cho Prod).
  publicly_accessible    = false 
  skip_final_snapshot    = true
  
  tags = { Name = "${var.project_name}-${var.environment}-db" }
}

# 3. Logical Databases & Users (Schema bên trong)
locals {
  app_services = ["users", "products", "orders"]
}

/* resource "postgresql_database" "db" {
  for_each = toset(local.app_services)
  name     = "foodhub_${each.key}"
  # Resource này phụ thuộc vào provider được cấu hình ở root
} 

resource "postgresql_role" "user" {
  for_each = toset(local.app_services)
  name     = "user_${each.key}"
  login    = true
  password = "Password_${each.key}_123" # Nên đưa ra biến nếu cần bảo mật cao hơn
}

resource "postgresql_grant" "db_grant" {
  for_each    = toset(local.app_services)
  database    = postgresql_database.db[each.key].name
  role        = postgresql_role.user[each.key].name
  schema      = "public"
  object_type = "database"
  privileges  = ["ALL"]
  depends_on  = [postgresql_role.user, postgresql_database.db]
}*/