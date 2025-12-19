output "jenkins_public_ip" {
  value = "http://${aws_instance.jenkins.public_ip}:8080"
}

output "sonarqube_public_ip" {
  value = "http://${aws_instance.jenkins.public_ip}:9000"
}

output "ecr_endpoints" {
  value = { for k, v in aws_ecr_repository.repos : k => v.repository_url }
}