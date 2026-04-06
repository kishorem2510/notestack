import json
import os
import base64
import boto3
from datetime import datetime, timezone

dynamodb = boto3.resource("dynamodb")
s3       = boto3.client("s3")
table    = dynamodb.Table(os.environ["TABLE_NAME"])
BUCKET   = os.environ["BUCKET_NAME"]

def respond(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        "body": json.dumps(body)
    }

def log(level, message, data=None):
    entry = {"level": level, "message": message}
    if data:
        entry["data"] = data
    print(json.dumps(entry))

def handler(event, context):
    try:
        # Extract userId from Cognito token
        user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
        note_id = event["pathParameters"]["noteId"]

        # Parse body
        body    = json.loads(event.get("body") or "{}")
        title   = body.get("title")
        content = body.get("content")

        if not title or not content:
            return respond(400, {"error": "title and content are required"})

        timestamp = datetime.now(timezone.utc).isoformat()

        # Handle optional new file upload
        file_data = body.get("file")
        file_name = body.get("fileName")
        file_key  = None

        if file_data and file_name:
            file_bytes = base64.b64decode(file_data)
            file_key   = f"users/{user_id}/{note_id}/{file_name}"

            s3.put_object(
                Bucket=BUCKET,
                Key=file_key,
                Body=file_bytes,
                ContentDisposition=f'attachment; filename="{file_name}"',
            )
            log("INFO", "File replaced in S3", {"key": file_key})

        # Build update expression dynamically
        update_expr   = "SET title = :t, content = :c, updatedAt = :u"
        expr_values   = {
            ":t": title,
            ":c": content,
            ":u": timestamp,
        }

        if file_key:
            update_expr += ", fileKey = :fk, fileName = :fn"
            expr_values[":fk"] = file_key
            expr_values[":fn"] = file_name

        result = table.update_item(
            Key={"userId": user_id, "noteId": note_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ConditionExpression="attribute_exists(noteId)",
            ReturnValues="ALL_NEW",
        )

        updated_note = result.get("Attributes", {})

        log("INFO", "Note updated", {"userId": user_id, "noteId": note_id})
        return respond(200, {"message": "Note updated", "note": updated_note})

    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        return respond(404, {"error": "Note not found"})

    except Exception as e:
        log("ERROR", "Failed to update note", {"error": str(e)})
        return respond(500, {"error": "Internal server error"})