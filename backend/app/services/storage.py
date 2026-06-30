import boto3
from botocore.config import Config
from app.config import settings
import uuid
from io import BytesIO


def get_b2_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.B2_ENDPOINT_URL,
        aws_access_key_id=settings.B2_KEY_ID,
        aws_secret_access_key=settings.B2_APP_KEY,
        config=Config(signature_version="s3v4"),
    )


async def upload_image(image_bytes: bytes, content_type: str = "image/webp") -> dict:
    """Upload image to Backblaze B2, return {url, key}."""
    client = get_b2_client()
    key = f"products/{uuid.uuid4()}.webp"
    client.put_object(
        Bucket=settings.B2_BUCKET_NAME,
        Key=key,
        Body=image_bytes,
        ContentType=content_type,
        ACL="public-read",
    )
    url = f"{settings.B2_ENDPOINT_URL}/{settings.B2_BUCKET_NAME}/{key}"
    return {"url": url, "key": key}


async def delete_image(key: str) -> None:
    client = get_b2_client()
    client.delete_object(Bucket=settings.B2_BUCKET_NAME, Key=key)
