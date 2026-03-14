terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket       = "alfredgamulo.com-infra"
    key          = "alfredgamulo.com/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true # Native S3 locking (Terraform >= 1.10) — no DynamoDB required
  }
}
