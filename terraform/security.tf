resource "aws_security_group" "jenkins_sg" {
  name        = "${var.project_name}-jenkins-sg"
  description = "Jenkins and SonarQube Security Group"
  vpc_id      = aws_vpc.main.id

  # Inbound: SSH, Jenkins (8080), SonarQube (9000)
  dynamic "ingress" {
    for_each = [22, 8080, 9000]
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"] # Trong thực tế nên giới hạn IP cá nhân
    }
  }

  # Outbound: Tất cả
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-jenkins-sg" }
}