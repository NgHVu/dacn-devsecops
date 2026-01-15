# --- SG cho Jenkins (Nếu bạn host Jenkins trên EC2) ---
resource "aws_security_group" "jenkins_sg" {
  name        = "${var.project_name}-${var.environment}-jenkins-sg"
  description = "Security Group for Jenkins"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Nên thay bằng IP Public của bạn để bảo mật
  }

  ingress {
    description = "Jenkins Dashboard"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    description = "SonarQube"
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-${var.environment}-jenkins-sg" }
}

# --- SG cho RDS (Database) ---
# Đây là cái quan trọng giúp Backend kết nối được DB
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security Group for RDS"
  vpc_id      = var.vpc_id

  # Cho phép EKS Node hoặc Jenkins truy cập vào Database (MySQL/Postgres)
  # Tạm thời allow all trong VPC, sau này sẽ thắt chặt chỉ allow từ EKS SG
  ingress {
    description = "Database Access from VPC"
    from_port   = 5432 # Hoặc 5432 nếu dùng Postgres
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # CIDR của VPC
  }

  tags = { Name = "${var.project_name}-${var.environment}-rds-sg" }
}