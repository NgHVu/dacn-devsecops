resource "aws_instance" "jenkins" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = aws_subnet.public_1.id
  vpc_security_group_ids = [aws_security_group.jenkins_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.jenkins_profile.name

  # Volume gp3 hiệu suất cao hơn gp2
  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  # Script cài đặt tự động
  user_data = file("${path.module}/../scripts/install_jenkins.sh")

  tags = {
    Name = "${var.project_name}-jenkins-server"
  }
}