# Response Headers Policy — adds COOP/COEP so Pyodide's SharedArrayBuffer works.
# Browsers gate SharedArrayBuffer (required by Pyodide) behind cross-origin
# isolation, which requires both headers on every response.
resource "aws_cloudfront_response_headers_policy" "site" {
  name    = "${replace(var.domain_name, ".", "-")}-security-headers"
  comment = "COOP + COEP for cross-origin isolation (Pyodide / SharedArrayBuffer)"

  custom_headers_config {
    items {
      header   = "Cross-Origin-Opener-Policy"
      value    = "same-origin"
      override = true
    }

    items {
      header   = "Cross-Origin-Embedder-Policy"
      value    = "credentialless"
      override = true
    }
  }
}

# Origin Access Control — SigV4 signing so CloudFront can read private S3
resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.domain_name}-oac"
  description                       = "OAC for ${var.domain_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = [var.domain_name, "www.${var.domain_name}"]
  price_class         = "PriceClass_100" # US / Canada / Europe edges only
  http_version        = "http2and3"
  tags                = local.tags

  origin {
    # Use regional domain name to avoid S3 redirect issues with OAC
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-${local.bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-${local.bucket_name}"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # AWS-managed CachingOptimized policy (ID is a well-known constant)
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    # Adds COOP + COEP headers required for cross-origin isolation (Pyodide)
    response_headers_policy_id = aws_cloudfront_response_headers_policy.site.id
  }

  # Astro outputs /404.html — map both 403 (S3 access denied) and 404 to it
  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
