output "rds_endpoint" {
  description = "Endpoint RDS Staging"
  value       = module.database.db_endpoint
}

output "eks_cluster_name" {
  description = "Tên Cluster Staging"
  value       = module.eks.cluster_name
}

output "bastion_public_ip" {
  description = "IP Bastion Staging"
  value       = aws_instance.bastion.public_ip
}

output "cmd_ssh_bastion" {
  description = "Lệnh SSH vào Bastion Staging"
  value       = "ssh -i ${var.key_name}.pem ubuntu@${aws_instance.bastion.public_ip}"
}

output "cmd_update_kubeconfig" {
  description = "Lệnh kết nối kubectl vào cluster Staging"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "cmd_get_argocd_pass" {
  description = "Lấy pass ArgoCD Staging"
  value       = "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d && echo"
}