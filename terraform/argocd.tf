# 1. Tự động cấu hình kubectl trên máy local
resource "null_resource" "update_kubeconfig" {
  depends_on = [aws_eks_cluster.main]

  provisioner "local-exec" {
    # Lệnh này sẽ chạy trên máy tính của bạn ngay sau khi cụm tạo xong
    command = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
  }
}

# 2. Cài đặt ArgoCD bằng Helm Chart (Chuẩn Enterprise)
resource "helm_release" "argocd" {
  name             = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  namespace        = "argocd"
  create_namespace = true
  version          = "5.51.6" # Phiên bản ổn định

  # Đợi Node Group sẵn sàng rồi mới cài
  depends_on = [
    aws_eks_node_group.main,
    null_resource.update_kubeconfig
  ]

  # Tùy chỉnh cấu hình ArgoCD (Dùng YAML values chuẩn hơn block set)
  values = [
    yamlencode({
      configs = {
        params = {
          "server.insecure" = true
        }
      }
    })
  ]
}

