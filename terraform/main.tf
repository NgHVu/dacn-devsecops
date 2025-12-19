# main.tf
resource "aws_instance" "jenkins_server" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
  
  vpc_security_group_ids = [aws_security_group.jenkins_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.jenkins_profile.name

  # Đọc nội dung file script để chạy khi khởi tạo
  user_data = file("${path.module}/../scripts/install_jenkins.sh")

  # Tăng dung lượng ổ cứng lên 20GB (Mặc định 8GB có thể bị đầy khi build Docker)
  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name = "${var.project_name}-Jenkins-Server"
  }
}