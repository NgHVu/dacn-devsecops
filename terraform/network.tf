# 1. Tạo VPC (Mạng riêng ảo)
resource "aws_vpc" "foodhub_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# 2. Tạo Internet Gateway (Cổng ra Internet) - QUAN TRỌNG NHẤT
resource "aws_internet_gateway" "foodhub_igw" {
  vpc_id = aws_vpc.foodhub_vpc.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# 3. Tạo Public Subnet (Phân mạng công khai)
resource "aws_subnet" "foodhub_public_subnet" {
  vpc_id                  = aws_vpc.foodhub_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true # Tự động cấp IP Public cho EC2
  availability_zone       = "${var.aws_region}a" # Ví dụ: ap-southeast-1a

  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

# 4. Tạo Route Table (Bảng định tuyến)
resource "aws_route_table" "foodhub_public_rt" {
  vpc_id = aws_vpc.foodhub_vpc.id

  # Định tuyến tất cả traffic (0.0.0.0/0) đi qua Internet Gateway
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.foodhub_igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# 5. Gắn Subnet vào Route Table
resource "aws_route_table_association" "foodhub_rta" {
  subnet_id      = aws_subnet.foodhub_public_subnet.id
  route_table_id = aws_route_table.foodhub_public_rt.id
}