output "db_endpoint" {
  value = aws_db_instance.postgres.address
}

output "db_port" {
  value = aws_db_instance.postgres.port
}

output "db_username" {
  value = aws_db_instance.postgres.username
}

output "db_password" {
  value = aws_db_instance.postgres.password
  sensitive = true
}

/* output "db_names" {
  # Trả về danh sách tên DB đã tạo để dùng cho K8s Secret sau này
  value = [for db in postgresql_database.db : db.name]
} */