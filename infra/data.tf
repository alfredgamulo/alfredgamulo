# Route53 hosted zone for the domain — must already exist in the AWS account
data "aws_route53_zone" "primary" {
  name         = var.domain_name
  private_zone = false
}
