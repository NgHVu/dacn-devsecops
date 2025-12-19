resource "aws_instance" "jenkins_server" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
  
  # Gắn vào Subnet mới và SG mới
  subnet_id              = aws_subnet.foodhub_public_subnet.id  # <--- THÊM DÒNG NÀY
  vpc_security_group_ids = [aws_security_group.jenkins_sg.id]
  
  iam_instance_profile   = aws_iam_instance_profile.jenkins_profile.name

  # Đường dẫn script (Chú ý dấu .. nếu bạn chạy từ thư mục infrastructure)
  user_data = file("${path.module}/../scripts/install_jenkins.sh")

  root_block_device {
    volume_size = 25 # Tăng nhẹ lên 25GB cho thoải mái
    volume_type = "gp3"
  }

  tags = {
    Name = "${var.project_name}-Jenkins-Server"
  }
}