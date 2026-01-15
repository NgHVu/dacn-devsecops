output "jenkins_url" {
  value = "http://${module.cicd.jenkins_public_ip}:8080"
}

output "rds_endpoint" {
  value = module.database.db_endpoint
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "ecr_repos" {
  value = module.ecr.repository_urls
}

output "cmd_update_kubeconfig" {
  description = "Chạy lệnh này để kết nối kubectl vào cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "cmd_get_argocd_pass" {
  description = "Lấy pass ArgoCD"
  value       = "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d && echo"
}