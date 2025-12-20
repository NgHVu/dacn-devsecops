resource "helm_release" "kube_prometheus_stack" {
  name             = "monitoring"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  namespace        = "monitoring"
  create_namespace = true
  version          = "56.6.2"

  # Timeout cao để tránh lỗi ngắt kết nối
  timeout = 2000
  
  # FIX: Tự động rollback nếu cài đặt thất bại
  atomic = true
  
  # FIX: Tự động xóa release nếu fail, tránh lỗi "cannot re-use a name" ở lần chạy sau
  cleanup_on_fail = true

  # Đôi khi cần force update nếu release bị kẹt ở trạng thái xấu
  force_update = true

  depends_on = [
    aws_eks_node_group.main
  ]

  values = [
    yamlencode({
      # Tắt Alertmanager để tiết kiệm tài nguyên trên node nhỏ
      alertmanager = {
        enabled = false
      }
      grafana = {
        adminPassword = "admin"
        # FIX: Tắt persistence để tránh lỗi PVC Pending do thiếu EBS CSI Driver
        persistence = {
          enabled = false 
        }
      }
      prometheus = {
        prometheusSpec = {
          # FIX: Tắt storage persistent cho Prometheus
          storageSpec = {}
          
          serviceMonitorSelectorNilUsesHelmValues = false
          serviceMonitorSelector = {}
          serviceMonitorNamespaceSelector = {}
          # Resource request nhỏ phù hợp t3.medium/small
          resources = {
            requests = {
              memory = "400Mi"
            }
          }
        }
      }
    })
  ]
}