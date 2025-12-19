# outputs.tf
output "jenkins_url" {
  description = "Đường dẫn truy cập Jenkins"
  value       = "http://${aws_instance.jenkins_server.public_ip}:8080"
}

output "sonarqube_url" {
  description = "Đường dẫn truy cập SonarQube"
  value       = "http://${aws_instance.jenkins_server.public_ip}:9000"
}

output "ecr_repository_urls" {
  description = "URL của các ECR Repositories đã tạo"
  value       = [for repo in aws_ecr_repository.foodhub_repos : repo.repository_url]
}

output "ssh_command" {
  description = "Lệnh SSH vào server"
  value       = "ssh -i ${var.key_name}.pem ubuntu@${aws_instance.jenkins_server.public_ip}"
}