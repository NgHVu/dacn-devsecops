variable "project_name" { type = string }
variable "environment" { type = string }
variable "hostname" { 
  type        = string 
  description = "Tên miền để truy cập Rancher (VD: rancher.localhost)" 
  default     = "rancher.localhost"
}