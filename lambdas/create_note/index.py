import json
import os
import uuid
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

        # Parse body
        body    = json.loads(event.get("body") or "{}")
        title   = body.get("title")
        content = body.get("content")

        if not title or not content:
            return respond(400, {"error": "title and content are required"})

        note_id   = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        # Handle optional file upload
        file_key = None
        file_name = None

        file_data = body.get("file")      # base64 string
        file_name = body.get("fileName")  # original filename

        if file_data and file_name:
            # Decode base64
            file_bytes = base64.b64decode(file_data)

            # S3 key: users/{userId}/{noteId}/{fileName}
            file_key = f"users/{user_id}/{note_id}/{file_name}"

            s3.put_object(
                Bucket=BUCKET,
                Key=file_key,
                Body=file_bytes,
                ContentDisposition=f'attachment; filename="{file_name}"',
            )
            log("INFO", "File uploaded to S3", {"key": file_key})

        item = {
            "userId":    user_id,
            "noteId":    note_id,
            "title":     title,
            "content":   content,
            "createdAt": timestamp,
            "updatedAt": timestamp,
        }

        if file_key:
            item["fileKey"]  = file_key
            item["fileName"] = file_name

        table.put_item(Item=item)

        log("INFO", "Note created", {"userId": user_id, "noteId": note_id})
        return respond(201, {"message": "Note created", "note": item})

    except Exception as e:
        log("ERROR", "Failed to create note", {"error": str(e)})
        return respond(500, {"error": "Internal server error"})