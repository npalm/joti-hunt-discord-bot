locals {
  role_path  = var.role_path == null ? "/${var.prefix}/" : var.role_path
  lambda_zip = "../functions/discord-bot/lambda.zip"
  name       = "${var.prefix}-message-in-a-bottle"
}

resource "aws_lambda_function" "main" {
  filename          = local.lambda_zip
  source_code_hash  = filebase64sha256(local.lambda_zip)
  function_name     = local.name
  role              = aws_iam_role.main.arn
  handler           = "index.handler"
  runtime           = var.lambda_runtime
  timeout           = var.lambda_timeout
  architectures     = [var.lambda_architecture]
  memory_size       = var.lambda_memory_size

  environment {
    variables = {
      DISCORD_WEBHOOK_URL = var.discord_webhook_url
      SSM_ARTICLE_ID = "/${var.prefix}/latest-published-article"
      SERVICE_NAME = "${var.prefix}-message-in-a-bottle"
    }
  }

  tags = var.tags
}


resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/lambda/${aws_lambda_function.main.function_name}"
  retention_in_days = var.logging_retention_in_days
  tags              = var.tags
}

data "aws_iam_policy_document" "lambda_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "main" {
  name                 = "${local.name}-role"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role_policy.json
  path                 = local.role_path
  tags                 = var.tags
}

resource "aws_iam_role_policy" "logging" {
  name = "logging"
  role = aws_iam_role.main.name
  policy = templatefile("${path.module}/policies/lambda-cloudwatch.json", {
    log_group_arn = aws_cloudwatch_log_group.main.arn
  })
}

resource "aws_iam_role_policy" "ssm" {
  name = "publish-eventbridge"
  role = aws_iam_role.main.name

  policy = templatefile("${path.module}/policies/lambda-ssm.json", {})
}


resource "aws_cloudwatch_event_rule" "trigger" {
  name                = "${var.prefix}-trigger-rule"
  schedule_expression = var.schedule_expression
  tags                = var.tags
}

resource "aws_cloudwatch_event_target" "trigger" {
  rule = aws_cloudwatch_event_rule.trigger.name
  arn  = aws_lambda_function.main.arn
}

resource "aws_lambda_permission" "syncer" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.trigger.arn
}
