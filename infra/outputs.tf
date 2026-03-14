output "bucket_name" {
  description = "The name of the private S3 site bucket."
  value       = aws_s3_bucket.site.bucket
}

output "distribution_id" {
  description = "The CloudFront distribution ID (used in cache invalidations)."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain" {
  description = "The CloudFront-assigned domain name (accessible before custom DNS propagates)."
  value       = aws_cloudfront_distribution.site.domain_name
}
