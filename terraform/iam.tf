# Role để EC2 có quyền thao tác với ECR
resource "aws_iam_role" "jenkins_role" {
  name = "${var.project_name}_jenkins_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

# Gán quyền Full Access ECR
resource "aws_iam_role_policy_attachment" "jenkins_ecr_policy" {
  role       = aws_iam_role.jenkins_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess"
}

# Tạo Instance Profile để gắn vào EC2
resource "aws_iam_instance_profile" "jenkins_profile" {
  name = "${var.project_name}_jenkins_profile"
  role = aws_iam_role.jenkins_role.name
}