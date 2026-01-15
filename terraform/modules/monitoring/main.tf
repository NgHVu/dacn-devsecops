resource "helm_release" "kube_prometheus_stack" {
  name             = "monitoring"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  namespace        = "monitoring"
  create_namespace = true
  version          = "56.6.2"

  timeout         = 2000
  atomic          = true
  cleanup_on_fail = true
  force_update    = true
  
  # Không cần depends_on ở đây nữa, ta sẽ xử lý ở root main.tf

  values = [
    yamlencode({
      # Cấu hình AlertManager gửi tin nhắn về Slack
      alertmanager = {
        enabled = true # Phải bật lên mới gửi được
        config = {
          global = {
            slack_api_url = var.slack_webhook_url
          }
          route = {
            group_by = ["alertname", "job"]
            receiver = "slack-notifications"
            routes = [{
              match = {
                severity = "critical" # Chỉ gửi lỗi nghiêm trọng
              }
              receiver = "slack-notifications"
            }]
          }
          receivers = [{
            name = "slack-notifications"
            slack_configs = [{
              channel     = "#devops-alerts" # Tên kênh Slack của bạn
              send_resolved = true
              title       = "{{ .GroupLabels.alertname }}"
              text        = "{{ .CommonAnnotations.summary }}\n{{ .CommonAnnotations.description }}"
            }]
          }]
        }
      }
      
      grafana = {
        adminPassword = "admin" # Nên đổi hoặc dùng Secret trong thực tế
        persistence = {
          enabled = var.enable_persistence
        }
        # Nếu dùng Ingress sau này để truy cập Grafana, thêm config tại đây
      }
      
      prometheus = {
        prometheusSpec = {
          # Logic: Nếu enable_persistence = false thì dùng object rỗng {}
          storageSpec = var.enable_persistence ? {
            volumeClaimTemplate = {
              spec = {
                accessModes = ["ReadWriteOnce"]
                resources = { requests = { storage = "10Gi" } }
              }
            }
          } : {}
          
          serviceMonitorSelectorNilUsesHelmValues = false
          resources = {
            requests = {
              memory = "400Mi" # Giữ mức thấp cho t3.medium
            }
          }
        }
      }
    })
  ]
}