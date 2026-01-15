# 1. Cài đặt Cert-Manager (Bắt buộc cho Rancher)
resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true
  version          = "v1.13.3"

  set {
    name  = "installCRDs"
    value = "true"
  }
}

# 2. Cài đặt Rancher
resource "helm_release" "rancher" {
  name             = "rancher"
  repository       = "https://releases.rancher.com/server-charts/stable"
  chart            = "rancher"
  namespace        = "cattle-system"
  create_namespace = true
  // version          = "2.8.2" # Chọn version ổn định

  # Rancher cần đợi cert-manager chạy xong mới cài được
  depends_on = [helm_release.cert_manager]

  set {
    name  = "hostname"
    value = var.hostname
  }

  # Cấu hình replicas = 1 để tiết kiệm resource cho môi trường Dev
  set {
    name  = "replicas"
    value = "1"
  }
  
  # Dùng bootstrap password để dễ login lần đầu
  set {
    name  = "bootstrapPassword"
    value = "admin" # (Lưu ý: Thực tế nên random)
  }
}