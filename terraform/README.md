# GitHub Webhook

<!-- BEGINNING OF PRE-COMMIT-TERRAFORM DOCS HOOK -->

## Requirements

| Name                                                                     | Version  |
| ------------------------------------------------------------------------ | -------- |
| <a name="requirement_terraform"></a> [terraform](#requirement_terraform) | >= 1.3.0 |
| <a name="requirement_aws"></a> [aws](#requirement_aws)                   | ~> 4.0   |
| <a name="requirement_random"></a> [random](#requirement_random)          | ~> 3.0   |

## Providers

| Name                                             | Version |
| ------------------------------------------------ | ------- |
| <a name="provider_aws"></a> [aws](#provider_aws) | ~> 4.0  |

## Modules

No modules.

## Resources

| Name                                                                                                                                                    | Type        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [aws_cloudwatch_log_group.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_log_group)                       | resource    |
| [aws_iam_role.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role)                                               | resource    |
| [aws_iam_role_policy.logging](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy)                              | resource    |
| [aws_iam_role_policy.publish](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy)                              | resource    |
| [aws_iam_role_policy.ssm](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy)                                  | resource    |
| [aws_lambda_function.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function)                                 | resource    |
| [aws_lambda_function_url.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function_url)                         | resource    |
| [aws_iam_policy_document.lambda_assume_role_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [aws_s3_object.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/s3_object)                                          | data source |

## Inputs

| Name                                                                                                         | Description                                                                                                                                                                                 | Type                                                                                                                                                                        | Default        | Required |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | :------: |
| <a name="input_event_bus"></a> [event_bus](#input_event_bus)                                                 | Event bus configuration.                                                                                                                                                                    | <pre>object({<br> arn = string<br> name = string<br> source = optional(string, "github.com")<br> })</pre>                                                                   | n/a            |   yes    |
| <a name="input_github_app_webhook_secret"></a> [github_app_webhook_secret](#input_github_app_webhook_secret) | Parameter Store for GitHub App Parameters.                                                                                                                                                  | <pre>object({<br> name = string<br> arn = string<br> })</pre>                                                                                                               | n/a            |   yes    |
| <a name="input_kms_key_arn"></a> [kms_key_arn](#input_kms_key_arn)                                           | Optional CMK Key ARN to be used for Parameter Store.                                                                                                                                        | `string`                                                                                                                                                                    | `null`         |    no    |
| <a name="input_lambda_architecture"></a> [lambda_architecture](#input_lambda_architecture)                   | AWS Lambda architecture. Lambda functions using Graviton processors ('arm64') tend to have better price/performance than 'x86_64' functions.                                                | `string`                                                                                                                                                                    | `"arm64"`      |    no    |
| <a name="input_lambda_artifact"></a> [lambda_artifact](#input_lambda_artifact)                               | The lambda artifact. Either a local file or an s3 object.                                                                                                                                   | <pre>object({<br> file = optional(string)<br> s3 = optional(object({<br> bucket = string<br> object_key = string<br> object_version = optional(string)<br> }))<br> })</pre> | `null`         |    no    |
| <a name="input_lambda_runtime"></a> [lambda_runtime](#input_lambda_runtime)                                  | AWS Lambda runtime.                                                                                                                                                                         | `string`                                                                                                                                                                    | `"nodejs18.x"` |    no    |
| <a name="input_lambda_timeout"></a> [lambda_timeout](#input_lambda_timeout)                                  | Time out of the lambda in seconds.                                                                                                                                                          | `number`                                                                                                                                                                    | `10`           |    no    |
| <a name="input_log_level"></a> [log_level](#input_log_level)                                                 | Logging level for lambda logging. Valid values are 'silly', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'.                                                                             | `string`                                                                                                                                                                    | `"INFO"`       |    no    |
| <a name="input_logging_kms_key_id"></a> [logging_kms_key_id](#input_logging_kms_key_id)                      | Specifies the kms key id to encrypt the logs with                                                                                                                                           | `string`                                                                                                                                                                    | `null`         |    no    |
| <a name="input_logging_retention_in_days"></a> [logging_retention_in_days](#input_logging_retention_in_days) | Specifies the number of days you want to retain log events for the lambda log group. Possible values are: 0, 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, and 3653. | `number`                                                                                                                                                                    | `7`            |    no    |
| <a name="input_prefix"></a> [prefix](#input_prefix)                                                          | The prefix used for naming resources                                                                                                                                                        | `string`                                                                                                                                                                    | n/a            |   yes    |
| <a name="input_role_path"></a> [role_path](#input_role_path)                                                 | The path that will be added to the role; if not set, the environment name will be used.                                                                                                     | `string`                                                                                                                                                                    | `null`         |    no    |
| <a name="input_role_permissions_boundary"></a> [role_permissions_boundary](#input_role_permissions_boundary) | Permissions boundary that will be added to the created role for the lambda.                                                                                                                 | `string`                                                                                                                                                                    | `null`         |    no    |
| <a name="input_tags"></a> [tags](#input_tags)                                                                | Map of tags that will be added to created resources. By default resources will be tagged with name and environment.                                                                         | `map(string)`                                                                                                                                                               | `{}`           |    no    |

## Outputs

| Name                                                        | Description |
| ----------------------------------------------------------- | ----------- |
| <a name="output_endpoint"></a> [endpoint](#output_endpoint) | n/a         |
| <a name="output_lambda"></a> [lambda](#output_lambda)       | n/a         |
| <a name="output_role"></a> [role](#output_role)             | n/a         |
