import json
import redis.asyncio as aioredis
from fastapi import WebSocket
from app.config import settings
from typing import DefaultDict
from collections import defaultdict

# user_id -> list of WebSocket connections
_connections: DefaultDict[int, list[WebSocket]] = defaultdict(list)


async def connect(user_id: int, ws: WebSocket):
    await ws.accept()
    _connections[user_id].append(ws)


def disconnect(user_id: int, ws: WebSocket):
    _connections[user_id].discard(ws) if hasattr(_connections[user_id], "discard") else None
    try:
        _connections[user_id].remove(ws)
    except ValueError:
        pass


async def broadcast_to_user(user_id: int, event: str, data: dict):
    message = json.dumps({"event": event, "data": data})
    dead = []
    for ws in _connections.get(user_id, []):
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        disconnect(user_id, ws)


async def publish_event(user_id: int, event: str, data: dict):
    """Publish via Redis Pub/Sub for multi-instance support.
    Falls back to direct broadcast if Redis is unavailable."""
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        channel = f"user:{user_id}"
        payload = json.dumps({"event": event, "data": data})
        await r.publish(channel, payload)
        await r.aclose()
    except Exception:
        # Redis not available — send directly to connected WebSockets
        await broadcast_to_user(user_id, event, data)


async def subscribe_and_forward(user_id: int, ws: WebSocket):
    """Subscribe to Redis channel and forward messages to WebSocket."""
    r = aioredis.from_url(settings.REDIS_URL)
    pubsub = r.pubsub()
    await pubsub.subscribe(f"user:{user_id}")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode()
                await ws.send_text(data)
    except Exception:
        pass
    finally:
        await pubsub.unsubscribe(f"user:{user_id}")
        await r.aclose()
