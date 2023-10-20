variable "prefix" {
  description = "The prefix used for naming resources"
  type        = string
  default     = "joti"
}

variable "tags" {
  description = "Map of tags that will be added to created resources. By default resources will be tagged with name and environment."
  type        = map(string)
  default     = {}
}

variable "lambda_timeout" {
  description = "Time out of the lambda in seconds."
  type        = number
  default     = 10
}

variable "role_path" {
  description = "The path that will be added to the role; if not set, the environment name will be used."
  type        = string
  default     = null
}

variable "logging_retention_in_days" {
  description = "Specifies the number of days you want to retain log events for the lambda log group. Possible values are: 0, 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, and 3653."
  type        = number
  default     = 7
}

variable "log_level" {
  description = "Logging level for lambda logging. Valid values are 'DEBUG', 'INFO', 'WARN', 'ERROR', 'SILENT'."
  type        = string
  default     = "INFO"
  validation {
    condition = anytrue([
      var.log_level == "DEBUG",
      var.log_level == "INFO",
      var.log_level == "WARN",
      var.log_level == "ERROR",
      var.log_level == "SILENT",
    ])
    error_message = "`log_level` value not valid. Valid values are 'DEBUG', 'INFO', 'WARN', 'ERROR', 'SILENT'."
  }
}

variable "lambda_runtime" {
  description = "AWS Lambda runtime."
  type        = string
  default     = "nodejs18.x"
}

variable "lambda_architecture" {
  description = "AWS Lambda architecture. Lambda functions using Graviton processors ('arm64') tend to have better price/performance than 'x86_64' functions. "
  type        = string
  default     = "arm64"
  validation {
    condition     = contains(["arm64", "x86_64"], var.lambda_architecture)
    error_message = "`lambda_architecture` value is not valid, valid values are: `arm64` and `x86_64`."
  }
}

variable "lambda_memory_size" {
  description = "The amount of memory in MB your Lambda Function can use at runtime."
  type        = number
  default     = 128
}

variable "schedule_expression" {
  description = "The schedule or rate (frequency) that determines when CloudWatch Events runs the rule. For more information, see Schedule Expressions for Rules in the Amazon CloudWatch User Guide."
  type        = string
  default     = "rate(1 minute)"
}

variable "discord_webhook_url" {
  type        = string
  description = "The Discord webhook URL to send messages to."  
  sensitive = true
  
}