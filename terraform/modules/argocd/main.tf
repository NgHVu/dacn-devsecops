# 1. Cài đặt ArgoCD (GitOps Operator)
resource "helm_release" "argocd" {
  name             = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  namespace        = "argocd"
  create_namespace = true
  version          = "5.51.6"

  timeout         = 600
  cleanup_on_fail = true
  atomic          = true

  values = [
    yamlencode({
      configs = {
        params = {
          "server.insecure" = true # Tắt TLS nội bộ để chạy sau Load Balancer/Port-forward dễ hơn
        }
      }
    })
  ]
}

# 2. Cài đặt Argo Rollouts (BẮT BUỘC cho Blue/Green Deployment)
resource "helm_release" "argo_rollouts" {
  name             = "argo-rollouts"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-rollouts"
  namespace        = "argo-rollouts"
  create_namespace = true
  version          = "2.32.0" # Chọn version tương thích

  # Cần cài Dashboard để xem mô phỏng Blue/Green trực quan
  values = [
    yamlencode({
      dashboard = {
        enabled = true
      }
    })
  ]
}