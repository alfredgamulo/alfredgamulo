resource "aws_cloudwatch_log_group" "cloudfront" {
  name              = "/cloudfront/${var.domain_name}"
  retention_in_days = 30
  tags              = local.tags
}

resource "aws_cloudwatch_dashboard" "site" {
  dashboard_name = replace(var.domain_name, ".", "-")

  # CloudFront metrics with Region="Global" are only available in us-east-1
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 24
        height = 6
        properties = {
          region  = "us-east-1"
          title   = "${var.domain_name} — CloudFront Traffic"
          view    = "timeSeries"
          stacked = false
          period  = 86400
          metrics = [
            ["AWS/CloudFront", "Requests", "Region", "Global", "DistributionId", aws_cloudfront_distribution.site.id, { stat = "Sum" }],
            ["AWS/CloudFront", "BytesDownloaded", "Region", "Global", "DistributionId", aws_cloudfront_distribution.site.id, { stat = "Sum" }],
            ["AWS/CloudFront", "4xxErrorRate", "Region", "Global", "DistributionId", aws_cloudfront_distribution.site.id, { stat = "Average" }],
            ["AWS/CloudFront", "5xxErrorRate", "Region", "Global", "DistributionId", aws_cloudfront_distribution.site.id, { stat = "Average" }],
            ["AWS/CloudFront", "TotalErrorRate", "Region", "Global", "DistributionId", aws_cloudfront_distribution.site.id, { stat = "Average" }]
          ]
        }
      }
    ]
  })
}
