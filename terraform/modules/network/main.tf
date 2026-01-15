# --- 1. VPC & INTERNET GATEWAY ---
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "${var.project_name}-${var.environment}-igw"
  }
}

# --- 2. PUBLIC SUBNETS (Cho Load Balancer, Jenkins, NAT Gateway) ---
resource "aws_subnet" "public" {
  count                   = length(var.public_subnets_cidr)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets_cidr[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                     = "${var.project_name}-${var.environment}-public-${count.index + 1}"
    "kubernetes.io/role/elb" = "1" # Tag bắt buộc để EKS nhận diện đây là nơi đặt Load Balancer công khai
  }
}

# --- 3. PRIVATE SUBNETS (Cho RDS, EKS Worker Nodes) ---
resource "aws_subnet" "private" {
  count             = length(var.private_subnets_cidr)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets_cidr[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name                              = "${var.project_name}-${var.environment}-private-${count.index + 1}"
    "kubernetes.io/role/internal-elb" = "1" # Tag cho Internal Load Balancer (nếu dùng)
  }
}

# --- 4. NAT GATEWAY CONFIGURATION (MỚI THÊM) ---
# Tạo IP Tĩnh (Elastic IP) cho NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "${var.project_name}-${var.environment}-nat-eip" }
}

# Tạo NAT Gateway (Đặt tại Public Subnet đầu tiên)
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id 

  tags = { Name = "${var.project_name}-${var.environment}-nat-gw" }

  # NAT Gateway cần Internet Gateway phải tồn tại trước để hoạt động
  depends_on = [aws_internet_gateway.igw]
}

# --- 5. ROUTING ---

# Route Table cho PUBLIC Subnet (Đi thẳng ra Internet Gateway)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "${var.project_name}-${var.environment}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = length(var.public_subnets_cidr)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table cho PRIVATE Subnet (Đi ra ngoài qua NAT Gateway)
# Đây là phần giúp EKS Node tải được Docker Image
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
  tags = { Name = "${var.project_name}-${var.environment}-private-rt" }
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnets_cidr)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}