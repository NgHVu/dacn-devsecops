terraform {
  backend "s3" {
    # Tên bucket vừa tạo ở Bước 3
    bucket         = "foodhub-dev-tfstate" 
    
    # Đường dẫn lưu file trong bucket (Folder/File)
    key            = "terraform.tfstate" 
    
    region         = "ap-southeast-1"
    
    # Tên bảng DynamoDB vừa tạo ở Bước 3
    dynamodb_table = "foodhub-dev-tf-locks" 
    
    encrypt        = true
  }
}