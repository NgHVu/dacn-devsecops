variable "project_name" { type = string }
variable "environment" { type = string }

# EKS cần biết đặt Cluster và Node ở đâu
variable "public_subnet_ids" { type = list(string) }  # Cho Cluster Endpoint
variable "private_subnet_ids" { type = list(string) } # Cho Worker Nodes (An toàn)