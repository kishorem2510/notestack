import json
import os
import boto3

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

        # Extract noteId from path
        note_id = event["pathParameters"]["noteId"]

        table.delete_item(
            Key={"userId": user_id, "noteId": note_id},
            ConditionExpression="attribute_exists(noteId)",
        )

        log("INFO", "Note deleted", {"userId": user_id, "noteId": note_id})
        return respond(200, {"message": "Note deleted"})

    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        return respond(404, {"error": "Note not found"})

    except Exception as e:
        log("ERROR", "Failed to delete note", {"error": str(e)})
        return respond(500, {"error": "Internal server error"})