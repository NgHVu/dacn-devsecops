resource "aws_ecr_repository" "foodhub_repos" {
  for_each             = var.ecr_repos
  name                 = each.value
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name    = "${var.project_name}-ecr-${each.value}"
    Project = var.project_name
  }
}