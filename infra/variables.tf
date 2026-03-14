variable "domain_name" {
  description = "The registered domain name for the site."
  type        = string
  default     = "alfredgamulo.com"
}

variable "aws_profile" {
  description = "AWS CLI named profile to use for all operations."
  type        = string
  default     = "core"
}

variable "aws_region" {
  description = "Primary AWS region for S3, CloudFront, and Route53 operations."
  type        = string
  default     = "us-east-1"
}
