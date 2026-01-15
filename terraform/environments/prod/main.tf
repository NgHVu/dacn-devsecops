terraform {
  required_providers {
    aws        = { source = "hashicorp/aws", version = "~> 5.0" }
    helm       = { source = "hashicorp/helm", version = "~> 2.12" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.24" }
    # Tạm thời comment PostgreSQL provider để tránh lỗi kết nối từ local (giống Dev)
    # postgresql = { source = "cyrilgdn/postgresql", version = "1.22.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  environment = var.environment
}

# --- 1. NETWORK (VPC Prod riêng biệt) ---
module "network" {
  source = "../../modules/network"

  project_name = var.project_name
  environment  = local.environment

  # VPC CIDR khác Dev để tránh xung đột nếu sau này Peering
  vpc_cidr             = "192.168.0.0/16"
  public_subnets_cidr  = ["192.168.1.0/24", "192.168.2.0/24"]
  private_subnets_cidr = ["192.168.3.0/24", "192.168.4.0/24"]
  availability_zones   = ["${var.aws_region}a", "${var.aws_region}b"]
}

# --- 2. SECURITY ---
module "security" {
  source = "../../modules/security"

  project_name = var.project_name
  environment  = local.environment
  vpc_id       = module.network.vpc_id
}

# --- 3. DATABASE (RDS Prod) ---
module "database" {
  source = "../../modules/database"

  project_name       = var.project_name
  environment        = local.environment
  private_subnet_ids = module.network.private_subnet_ids
  rds_sg_id          = module.security.rds_sg_id
  db_password        = var.db_password
}

# --- 4. EKS CLUSTER (Prod Cluster) ---
module "eks" {
  source = "../../modules/eks"

  project_name = var.project_name
  environment  = local.environment

  # Prod dùng NAT Gateway nên Node nằm ở Private Subnet là chuẩn bài
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids
}

# --- CONFIG PROVIDER K8S & HELM ---
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    command     = "aws"
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
      command     = "aws"
    }
  }
}

# --- 5. MONITORING (Prometheus/Grafana riêng cho Prod) ---
module "monitoring" {
  source = "../../modules/monitoring"

  project_name      = var.project_name
  environment       = local.environment
  depends_on        = [module.eks]
  slack_webhook_url = var.slack_webhook_url
}

# --- 6. ARGOCD & ARGO ROLLOUTS (Quản lý riêng Prod) ---
module "argocd" {
  source = "../../modules/argocd"

  project_name = var.project_name
  environment  = local.environment
  depends_on   = [module.eks]
}

# --- 7. RANCHER (Quản lý riêng Prod) ---
module "rancher" {
  source = "../../modules/rancher"

  project_name = var.project_name
  environment  = local.environment
  hostname     = "rancher-prod.localhost"

  depends_on = [module.eks]
}

# --- 8. APP NAMESPACES ---
resource "kubernetes_namespace" "foodhub_app" {
  metadata {
    name = "${var.project_name}-${var.environment}" # foodhub-prod
  }
  depends_on = [module.eks]
}