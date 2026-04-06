import json
import os
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_cognito as cognito,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_iam as iam,
    aws_secretsmanager as secretsmanager,
    aws_cloudwatch as cloudwatch,
)
from constructs import Construct


class InfraStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # ── 1. DynamoDB Table ──────────────────────────────────────
        notes_table = dynamodb.Table(
            self, "NoteStackNotes",
            table_name="NoteStack-Notes",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="noteId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ── 2. S3 Bucket ───────────────────────────────────────────
        files_bucket = s3.Bucket(
            self, "NoteStackFiles",
            bucket_name=f"notestack-files-{self.account}",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            cors=[s3.CorsRule(
                allowed_methods=[
                    s3.HttpMethods.GET,
                    s3.HttpMethods.PUT,
                    s3.HttpMethods.POST,
                ],
                allowed_origins=["*"],
                allowed_headers=["*"],
            )],
        )

        # ── 3. Cognito User Pool ───────────────────────────────────
        user_pool = cognito.UserPool(
            self, "NoteStackUsers",
            user_pool_name="NoteStack-Users",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_uppercase=True,
                require_digits=True,
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.DESTROY,
        )

        user_pool_client = cognito.UserPoolClient(
            self, "NoteStackWebApp",
            user_pool=user_pool,
            user_pool_client_name="NoteStack-WebApp",
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True,
            ),
            generate_secret=False,
        )

        # ── 4. IAM Role for Lambda ─────────────────────────────────
        lambda_role = iam.Role(
            self, "NoteStackLambdaRole",
            role_name="NoteStack-Lambda-Role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        notes_table.grant_read_write_data(lambda_role)
        files_bucket.grant_read_write(lambda_role)

        lambda_role.add_to_policy(iam.PolicyStatement(
            actions=["secretsmanager:GetSecretValue"],
            resources=["*"],
        ))

        # ── 5. Secrets Manager ─────────────────────────────────────
        secretsmanager.Secret(
            self, "NoteStackConfig",
            secret_name="notestack/config",
            secret_string_value=cdk.SecretValue.unsafe_plain_text(
                json.dumps({
                    "userPoolId": user_pool.user_pool_id,
                    "userPoolClientId": user_pool_client.user_pool_client_id,
                    "tableName": notes_table.table_name,
                    "bucketName": files_bucket.bucket_name,
                })
            ),
        )

        # ── 6. Lambda Environment Variables ───────────────────────
        lambda_env = {
            "TABLE_NAME":   notes_table.table_name,
            "BUCKET_NAME":  files_bucket.bucket_name,
            "USER_POOL_ID": user_pool.user_pool_id,
        }

        lambdas_dir = os.path.join(
            os.path.dirname(__file__), "../../lambdas"
        )

        def make_lambda(fn_id, fn_name, folder):
            return lambda_.Function(
                self, fn_id,
                function_name=fn_name,
                runtime=lambda_.Runtime.PYTHON_3_11,
                handler="index.handler",
                code=lambda_.Code.from_asset(
                    os.path.join(lambdas_dir, folder)
                ),
                role=lambda_role,
                environment=lambda_env,
                timeout=Duration.seconds(10),
            )

        create_fn  = make_lambda("CreateNote",  "NoteStack-CreateNote",  "create_note")
        get_all_fn = make_lambda("GetNotes",    "NoteStack-GetNotes",    "get_notes")
        get_one_fn = make_lambda("GetNote",     "NoteStack-GetNote",     "get_note")
        update_fn  = make_lambda("UpdateNote",  "NoteStack-UpdateNote",  "update_note")
        delete_fn  = make_lambda("DeleteNote",  "NoteStack-DeleteNote",  "delete_note")

        # ── 7. API Gateway + Cognito Authorizer ────────────────────
        api = apigw.RestApi(
            self, "NoteStackAPI",
            rest_api_name="NoteStack-API",
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"],
            ),
            deploy_options=apigw.StageOptions(stage_name="dev"),
        )

        authorizer = apigw.CognitoUserPoolsAuthorizer(
            self, "CognitoAuth",
            cognito_user_pools=[user_pool],
            authorizer_name="NoteStack-Authorizer",
        )

        def add_auth_method(resource, http_method, lambda_fn):
            resource.add_method(
                http_method,
                apigw.LambdaIntegration(lambda_fn),
                authorization_type=apigw.AuthorizationType.COGNITO,
                authorizer=authorizer,
            )

        # /notes
        notes_resource = api.root.add_resource("notes")
        add_auth_method(notes_resource, "POST", create_fn)
        add_auth_method(notes_resource, "GET",  get_all_fn)

        # /notes/{noteId}
        note_resource = notes_resource.add_resource("{noteId}")
        add_auth_method(note_resource, "GET",    get_one_fn)
        add_auth_method(note_resource, "PUT",    update_fn)
        add_auth_method(note_resource, "DELETE", delete_fn)

        # ── 8. CloudWatch Dashboard ────────────────────────────────
        cloudwatch.Dashboard(
            self, "NoteStackDashboard",
            dashboard_name="NoteStack-Dashboard",
        )

        # ── 9. Stack Outputs ───────────────────────────────────────
        CfnOutput(self, "ApiUrl",
                  value=api.url)
        CfnOutput(self, "UserPoolId",
                  value=user_pool.user_pool_id)
        CfnOutput(self, "UserPoolClientId",
                  value=user_pool_client.user_pool_client_id)
        CfnOutput(self, "BucketName",
                  value=files_bucket.bucket_name)
        CfnOutput(self, "TableName",
                  value=notes_table.table_name)