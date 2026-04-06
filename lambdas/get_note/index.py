import json
import os
import boto3

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
        user_id = event["requestContext"]["authorizer"]["claims"]["sub"]
        note_id = event["pathParameters"]["noteId"]

        result = table.get_item(
            Key={"userId": user_id, "noteId": note_id}
        )

        note = result.get("Item")

        if not note:
            return respond(404, {"error": "Note not found"})

        # Generate presigned URL if file exists (valid for 1 hour)
        if note.get("fileKey"):
            note["fileUrl"] = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": BUCKET, "Key": note["fileKey"]},
                ExpiresIn=3600,
            )

        log("INFO", "Note fetched", {"userId": user_id, "noteId": note_id})
        return respond(200, {"note": note})

    except Exception as e:
        log("ERROR", "Failed to get note", {"error": str(e)})
        return respond(500, {"error": "Internal server error"})