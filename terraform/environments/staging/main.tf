terraform {
  required_providers {
    aws        = { source = "hashicorp/aws", version = "~> 5.0" }
    helm       = { source = "hashicorp/helm", version = "~> 2.12" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.24" }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  environment = var.environment
}

# --- 1. NETWORK (VPC Staging: 172.16.x.x) ---
module "network" {
  source = "../../modules/network"
  
  project_name         = var.project_name
  environment          = local.environment
  
  # Dùng dải IP riêng biệt
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
  vpc_cidr     = "172.16.0.0/16" # QUAN TRỌNG: Để mở port 5432 nội bộ Staging
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

# --- 4. BASTION HOST (Staging) ---
# Nên có Bastion ở Staging để test quy trình kết nối DB giống hệt Prod

# 4.1. Security Group Bastion
resource "aws_security_group" "bastion_sg" {
  name        = "${var.project_name}-${var.environment}-bastion-sg"
  description = "Allow SSH to Bastion Staging"
  vpc_id      = module.network.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] 
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = { Name = "${var.project_name}-${var.environment}-bastion-sg" }
}

# 4.2. Instance Bastion
resource "aws_instance" "bastion" {
  ami                         = "ami-047126e50991d067b" # Ubuntu 22.04 LTS
  instance_type               = "t3.micro"
  subnet_id                   = module.network.public_subnet_ids[0]
  vpc_security_group_ids      = [aws_security_group.bastion_sg.id]
  key_name                    = var.key_name
  associate_public_ip_address = true

  tags = { Name = "${var.project_name}-${var.environment}-bastion" }
}

# 4.3. Rule: Bastion -> RDS
resource "aws_security_group_rule" "allow_bastion_to_rds" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = module.security.rds_sg_id
  source_security_group_id = aws_security_group.bastion_sg.id
}

# --- 5. EKS CLUSTER (Staging Cluster) ---
module "eks" {
  source = "../../modules/eks"

  project_name       = var.project_name
  environment        = local.environment
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids
}

# --- CONFIG PROVIDER ---
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

# --- 6. MONITORING ---
module "monitoring" {
  source = "../../modules/monitoring"

  project_name      = var.project_name
  environment       = local.environment
  depends_on        = [module.eks]
  slack_webhook_url = var.slack_webhook_url
}

# --- 7. ARGOCD ---
module "argocd" {
  source = "../../modules/argocd"

  project_name = var.project_name
  environment  = local.environment
  depends_on   = [module.eks]
}

# --- 8. RANCHER ---
module "rancher" {
  source = "../../modules/rancher"

  project_name = var.project_name
  environment  = local.environment
  hostname     = "rancher-staging.localhost"
  depends_on   = [module.eks]
}

# --- 9. APP NAMESPACES ---
resource "kubernetes_namespace" "foodhub_app" {
  metadata {
    name = "${var.project_name}-${var.environment}" 
  }
  depends_on = [module.eks]
}

module "remote_backend" {
  source = "../../modules/remote-backend"
  project_name = var.project_name
  environment  = local.environment
}