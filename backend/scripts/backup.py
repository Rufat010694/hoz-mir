#!/usr/bin/env python3
"""
Ежедневный бэкап БД в Backblaze B2.
Запускается как Railway Cron Job: 0 3 * * * (каждый день в 03:00 UTC)

Переменные окружения (те же что у основного сервиса):
  DATABASE_SYNC_URL   — postgresql+psycopg://...
  B2_KEY_ID           — Backblaze B2 Key ID
  B2_APP_KEY          — Backblaze B2 Application Key
  B2_BUCKET_NAME      — имя bucket
  B2_ENDPOINT_URL     — endpoint Backblaze
"""
import os
import subprocess
import boto3
from datetime import datetime, timezone

DATABASE_URL = os.environ["DATABASE_SYNC_URL"]
B2_KEY_ID     = os.environ["B2_KEY_ID"]
B2_APP_KEY    = os.environ["B2_APP_KEY"]
B2_BUCKET     = os.environ.get("B2_BUCKET_NAME", "hozmir-photos")
B2_ENDPOINT   = os.environ.get("B2_ENDPOINT_URL", "https://s3.us-west-004.backblazeb2.com")

# Имя файла: backup_2026-06-30T03-00.sql.gz
timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M")
filename  = f"backup_{timestamp}.sql.gz"
filepath  = f"/tmp/{filename}"

def dump_db():
    """pg_dump → gzip → /tmp/backup_*.sql.gz"""
    print(f"Dumping database to {filepath}...")
    # Конвертируем psycopg3 URL в стандартный postgres://
    pg_url = DATABASE_URL.replace("postgresql+psycopg://", "postgresql://")
    result = subprocess.run(
        f'pg_dump "{pg_url}" | gzip > {filepath}',
        shell=True, capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"pg_dump failed: {result.stderr}")
    size = os.path.getsize(filepath)
    print(f"Dump complete: {size / 1024:.1f} KB")

def upload_to_b2():
    """Загружаем дамп в B2 в папку backups/"""
    print(f"Uploading to B2 bucket '{B2_BUCKET}'...")
    s3 = boto3.client(
        "s3",
        endpoint_url=B2_ENDPOINT,
        aws_access_key_id=B2_KEY_ID,
        aws_secret_access_key=B2_APP_KEY,
    )
    s3.upload_file(filepath, B2_BUCKET, f"backups/{filename}")
    print(f"Uploaded: backups/{filename}")

def cleanup_old_backups(keep=14):
    """Удаляем бэкапы старше keep дней."""
    print(f"Cleaning up backups older than {keep} days...")
    s3 = boto3.client(
        "s3",
        endpoint_url=B2_ENDPOINT,
        aws_access_key_id=B2_KEY_ID,
        aws_secret_access_key=B2_APP_KEY,
    )
    response = s3.list_objects_v2(Bucket=B2_BUCKET, Prefix="backups/")
    objects = response.get("Contents", [])
    objects.sort(key=lambda x: x["LastModified"])
    to_delete = objects[:-keep] if len(objects) > keep else []
    for obj in to_delete:
        s3.delete_object(Bucket=B2_BUCKET, Key=obj["Key"])
        print(f"Deleted old backup: {obj['Key']}")

if __name__ == "__main__":
    try:
        dump_db()
        upload_to_b2()
        cleanup_old_backups(keep=14)  # хранить последние 14 дней
        os.remove(filepath)
        print("Backup completed successfully.")
    except Exception as e:
        print(f"ERROR: {e}")
        raise SystemExit(1)
