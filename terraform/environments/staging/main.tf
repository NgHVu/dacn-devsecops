terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
    helm = { source = "hashicorp/helm", version = "~> 2.12" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.24" }
    # Tạm thời comment PostgreSQL để tránh lỗi kết nối từ local
    # postgresql = { source = "cyrilgdn/postgresql", version = "1.22.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  environment = var.environment
}

# --- 1. NETWORK (VPC Staging riêng biệt) ---
module "network" {
  source = "../../modules/network"
  
  project_name         = var.project_name
  environment          = local.environment
  
  # Dùng dải IP khác Dev và Prod để dễ quản lý
  vpc_cidr             = "172.16.0.0/16" 
  public_subnets_cidr  = ["172.16.1.0/24", "172.16.2.0/24"]
  private_subnets_cidr = ["172.16.3.0/24", "172.16.4.0/24"]
  availability_zones   = ["${var.aws_region}a", "${var.aws_region}b"]
}

# --- 2. SECURITY ---
module "security" {
  source = "../../modules/security"

  project_name = var.project_name
  environment  = local.environment
  vpc_id       = module.network.vpc_id
}

# --- 3. DATABASE (RDS Staging) ---
module "database" {
  source = "../../modules/database"

  project_name       = var.project_name
  environment        = local.environment
  private_subnet_ids = module.network.private_subnet_ids
  rds_sg_id          = module.security.rds_sg_id
  db_password        = var.db_password 
}

# --- 4. EKS CLUSTER (Staging Cluster) ---
module "eks" {
  source = "../../modules/eks"

  project_name       = var.project_name
  environment        = local.environment
  
  # Node nằm Private Subnet (Vì đã có NAT Gateway trong module network)
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

# --- 5. MONITORING (Prometheus/Grafana riêng cho Staging) ---
module "monitoring" {
  source = "../../modules/monitoring"

  project_name      = var.project_name
  environment       = local.environment
  depends_on        = [module.eks]
  slack_webhook_url = var.slack_webhook_url
}

# --- 6. ARGOCD & ARGO ROLLOUTS ---
module "argocd" {
  source = "../../modules/argocd"

  project_name = var.project_name
  environment  = local.environment
  depends_on   = [module.eks]
}

# --- 7. RANCHER ---
module "rancher" {
  source = "../../modules/rancher"

  project_name = var.project_name
  environment  = local.environment
  hostname     = "rancher-staging.localhost" 
  
  depends_on   = [module.eks]
}

# --- 8. APP NAMESPACES ---
resource "kubernetes_namespace" "foodhub_app" {
  metadata {
    name = "${var.project_name}-${var.environment}" # foodhub-staging
  }
  depends_on = [module.eks]
}