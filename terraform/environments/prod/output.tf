output "rds_endpoint" {
  description = "Endpoint kết nối Database Prod"
  value       = module.database.db_endpoint
}

output "eks_cluster_name" {
  description = "Tên Cluster EKS"
  value       = module.eks.cluster_name
}

output "bastion_public_ip" {
  description = "IP Public của Bastion Host để SSH"
  value       = aws_instance.bastion.public_ip
}

output "cmd_ssh_bastion" {
  description = "Lệnh SSH nhanh vào Bastion Host"
  value       = "ssh -i ${var.key_name}.pem ubuntu@${aws_instance.bastion.public_ip}"
}

output "cmd_update_kubeconfig" {
  description = "Lệnh kết nối kubectl vào cluster Prod"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "cmd_get_argocd_pass" {
  description = "Lệnh lấy mật khẩu ArgoCD Prod"
  value       = "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d && echo"
}