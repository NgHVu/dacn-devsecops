# --- CI/CD SERVERS ---
output "jenkins_public_ip" {
  value = "http://${aws_instance.jenkins.public_ip}:8080"
}

output "sonarqube_public_ip" {
  value = "http://${aws_instance.jenkins.public_ip}:9000"
}

# --- CONTAINER REGISTRY ---
output "ecr_endpoints" {
  value = { for k, v in aws_ecr_repository.repos : k => v.repository_url }
}

# --- KUBERNETES CLUSTER (EKS) ---
output "eks_cluster_name" {
  value = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

output "configure_kubectl_command" {
  description = "Lệnh cấu hình kubectl trên máy local"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}

# --- DATABASE (RDS) ---
output "rds_endpoint" {
  description = "Địa chỉ kết nối Database (PostgreSQL)"
  value       = aws_db_instance.postgres.endpoint
}

# --- GITOPS & MONITORING (COMMANDS) ---
output "argocd_password_command" {
  description = "Lệnh lấy mật khẩu đăng nhập ArgoCD (User: admin)"
  value       = "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d && echo"
}

output "argocd_port_forward_command" {
  description = "Lệnh truy cập ArgoCD UI (https://localhost:8080)"
  value       = "kubectl port-forward svc/argocd-server -n argocd 8080:443"
}

output "grafana_port_forward_command" {
  description = "Lệnh truy cập Grafana UI (User: admin / Pass: admin) -> http://localhost:3000"
  value       = "kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80"
}