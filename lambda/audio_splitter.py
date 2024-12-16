import os
import json
import boto3
import traceback
from pydub import AudioSegment
from botocore.exceptions import BotoCoreError, ClientError

s3 = boto3.client('s3')

def handler(event, context):
    # Validate environment variable
    bucket_name = os.environ.get('BUCKET_NAME')
    if not bucket_name:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "BUCKET_NAME environment variable is not set"})
        }

    # Parse the incoming event to get file details
    try:
        body = json.loads(event['body'])
        key = body['key']
        if not key.endswith(".mp3"):  # Check for valid file extension
            raise ValueError("Invalid file format. Only MP3 files are supported.")
    except (KeyError, json.JSONDecodeError, ValueError) as e:
        return {"statusCode": 400, "body": json.dumps({"error": str(e)})}

    # Download file from S3
    local_file = f"/tmp/{key.split('/')[-1]}"
    try:
        s3.download_file(bucket_name, key, local_file)
    except (BotoCoreError, ClientError) as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Failed to download file from S3", "details": str(e)})
        }

    # Process the audio file
    try:
        audio = AudioSegment.from_file(local_file)
        duration = len(audio)  # Duration in milliseconds

        # Split the audio
        split_point = duration // 2
        part1 = audio[:split_point]
        part2 = audio[split_point:]

        # Save the parts locally
        part1_path = "/tmp/part1.mp3"
        part2_path = "/tmp/part2.mp3"
        part1.export(part1_path, format="mp3")
        part2.export(part2_path, format="mp3")

        # Upload the parts back to S3
        part1_key = f"processed/{key.split('/')[-1].replace('.mp3', '_part1.mp3')}"
        part2_key = f"processed/{key.split('/')[-1].replace('.mp3', '_part2.mp3')}"
        s3.upload_file(part1_path, bucket_name, part1_key)
        s3.upload_file(part2_path, bucket_name, part2_key)
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": "Failed to process audio",
                "details": traceback.format_exc()
            })
        }

    # Return the result
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Audio split successfully",
            "files": [part1_key, part2_key]
        })
    }
