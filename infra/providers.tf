provider "aws" {
  profile = var.aws_profile
  region  = var.aws_region
}

# Alias required for ACM: CloudFront certificates must live in us-east-1
provider "aws" {
  alias   = "us_east_1"
  profile = var.aws_profile
  region  = "us-east-1"
}
