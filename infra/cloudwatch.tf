resource "aws_cloudwatch_log_group" "cloudfront" {
  name              = "/cloudfront/${var.domain_name}"
  retention_in_days = 30
  tags              = local.tags
}
