variable "project_name" { type = string }
variable "environment" { type = string }

# Tùy chọn bật tắt AlertManager (Prod bật, Dev tắt cho nhẹ)
variable "enable_alertmanager" {
  type    = bool
  default = false
}

# Tùy chọn lưu trữ dữ liệu lâu dài (Persistence)
variable "enable_persistence" {
  type    = bool
  default = false
}

variable "slack_webhook_url" {
  type        = string
  description = "URL Webhook của Slack để nhận thông báo"
  default     = "" 
}