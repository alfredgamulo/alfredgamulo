locals {
  # Site bucket name equals the registered domain — globally unique by definition
  bucket_name = var.domain_name

  tags = {
    project    = "alfredgamulo"
    managed_by = "terraform"
  }
}
