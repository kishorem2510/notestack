import json
import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
table    = dynamodb.Table(os.environ["TABLE_NAME"])

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

        # Query all notes for this user
        result = table.query(
            KeyConditionExpression=Key("userId").eq(user_id)
        )

        notes = result.get("Items", [])

        log("INFO", "Notes fetched", {"userId": user_id, "count": len(notes)})
        return respond(200, {"notes": notes})

    except Exception as e:
        log("ERROR", "Failed to get notes", {"error": str(e)})
        return respond(500, {"error": "Internal server error"})