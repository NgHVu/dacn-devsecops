terraform {
  required_providers {
    aws        = { source = "hashicorp/aws", version = "~> 5.0" }
    helm       = { source = "hashicorp/helm", version = "~> 2.12" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.24" }
    postgresql = { source = "cyrilgdn/postgresql", version = "1.22.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  environment = var.environment
}

# --- 1. NETWORK ---
module "network" {
  source = "../../modules/network" # <-- Lùi ra 2 cấp để tìm module

  project_name         = var.project_name
  environment          = local.environment
  vpc_cidr             = "10.0.0.0/16"
  public_subnets_cidr  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets_cidr = ["10.0.3.0/24", "10.0.4.0/24"]
  availability_zones   = ["${var.aws_region}a", "${var.aws_region}b"]
}

# --- 2. SECURITY ---
module "security" {
  source = "../../modules/security"

  project_name = var.project_name
  environment  = local.environment
  vpc_id       = module.network.vpc_id
}

# --- 3. DATABASE (RDS) ---
module "database" {
  source = "../../modules/database"

  project_name       = var.project_name
  environment        = local.environment
  private_subnet_ids = module.network.private_subnet_ids
  rds_sg_id          = module.security.rds_sg_id

  # Sử dụng biến thay vì hard-code password
  db_password = var.db_password
}

# --- CONFIG PROVIDER POSTGRESQL ---
provider "postgresql" {
  host            = module.database.db_endpoint
  port            = module.database.db_port
  username        = module.database.db_username
  password        = module.database.db_password
  superuser       = false
  sslmode         = "require"
  connect_timeout = 15
}

# --- 4. EKS CLUSTER ---
module "eks" {
  source = "../../modules/eks"

  project_name       = var.project_name
  environment        = local.environment
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

# --- 5. MONITORING (Prometheus/Grafana) ---
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

# --- 7. ECR REPOSITORIES ---
module "ecr" {
  source = "../../modules/ecr"

  project_name = var.project_name
  ecr_repos    = var.ecr_repos
}

# --- 8. CICD SERVER (JENKINS) ---
module "cicd" {
  source = "../../modules/cicd"

  project_name       = var.project_name
  environment        = local.environment
  vpc_id             = module.network.vpc_id
  subnet_id          = module.network.public_subnet_ids[0]
  security_group_ids = [module.security.jenkins_sg_id]
  ami_id             = var.ami_id
  instance_type      = var.instance_type
  key_name           = var.key_name
}

# --- 9. REMOTE STATE INFRASTRUCTURE ---
# Tạo S3 và DynamoDB để chuẩn bị cho việc chuyển đổi backend
module "remote_backend" {
  source = "../../modules/remote-backend"

  project_name = var.project_name
  environment  = local.environment
}

# --- 10. RANCHER ---
module "rancher" {
  source = "../../modules/rancher"

  project_name = var.project_name
  environment  = local.environment
  # Để truy cập Rancher, bạn cần Port-Forward sau khi cài xong
  hostname = "rancher.localhost"

  depends_on = [module.eks]
}

# --- 11. APP NAMESPACES (Tự động tạo nơi chứa App) ---
resource "kubernetes_namespace" "foodhub_app" {
  metadata {
    # Tên namespace sẽ là "foodhub-dev" (nhờ biến environment)
    name = "${var.project_name}-${var.environment}"
  }

  # Quan trọng: Phải đợi EKS tạo xong mới kết nối để tạo namespace được
  depends_on = [module.eks]
}