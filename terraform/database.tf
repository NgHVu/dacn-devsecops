# 1. Security Group cho Database
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow inbound traffic from EKS nodes"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from EKS Nodes"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_eks_cluster.main.vpc_config[0].cluster_security_group_id]
  }

  ingress {
    description = "PostgreSQL from Developer Workspace"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 2. Subnet Group cho RDS
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = { Name = "${var.project_name}-db-subnet-group" }
}

# 3. RDS Instance (PostgreSQL)
resource "aws_db_instance" "postgres" {
  identifier             = "${var.project_name}-db"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  engine                 = "postgres"
  
  # FIX: Cập nhật chính xác phiên bản bạn nhìn thấy trên Console (16.11)
  engine_version         = "16.11"
  
  username               = "foodhub_admin"
  password               = "FoodHub12345"
  db_name                = "postgres"
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  
  publicly_accessible    = true
  skip_final_snapshot    = true
  
  tags = { Project = var.project_name }
}

# --- TỰ ĐỘNG HÓA TẠO 3 DATABASE VÀ 3 USER ---

provider "postgresql" {
  host            = aws_db_instance.postgres.address
  port            = 5432
  database        = "postgres"
  username        = aws_db_instance.postgres.username
  password        = aws_db_instance.postgres.password
  sslmode         = "require"
  connect_timeout = 15
  superuser       = false
}

locals {
  app_services = ["users", "products", "orders"]
}

resource "postgresql_database" "db" {
  for_each = toset(local.app_services)
  name     = "foodhub_${each.key}"
}

resource "postgresql_role" "user" {
  for_each = toset(local.app_services)
  name     = "user_${each.key}"
  login    = true
  password = "Password_${each.key}_123"
}

resource "postgresql_grant" "db_grant" {
  for_each    = toset(local.app_services)
  database    = postgresql_database.db[each.key].name
  role        = postgresql_role.user[each.key].name
  schema      = "public"
  object_type = "database"
  privileges  = ["ALL"]
  depends_on  = [postgresql_role.user, postgresql_database.db]
}