output "rds_endpoint" {
  value = module.database.db_endpoint
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "cmd_update_kubeconfig" {
  description = "Chạy lệnh này để kết nối kubectl vào cluster Staging"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "cmd_get_argocd_pass" {
  description = "Lấy pass ArgoCD Staging"
  value       = "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d && echo"
}