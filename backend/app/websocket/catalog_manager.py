"""WebSocket manager for public catalog clients (no auth required)."""
import json
import redis.asyncio as aioredis
from fastapi import WebSocket
from app.config import settings
from collections import defaultdict
from typing import DefaultDict

# channel -> list of WebSocket connections
_connections: DefaultDict[str, list[WebSocket]] = defaultdict(list)


async def catalog_connect(channel: str, ws: WebSocket):
    await ws.accept()
    _connections[channel].append(ws)


def catalog_disconnect(channel: str, ws: WebSocket):
    try:
        _connections[channel].remove(ws)
    except ValueError:
        pass


async def catalog_broadcast(channel: str, event: str, data: dict):
    message = json.dumps({"event": event, "data": data})
    dead = []
    for ws in _connections.get(channel, []):
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        catalog_disconnect(channel, ws)


async def publish_catalog_event(slug: str, event: str, data: dict):
    """Публикуем событие в Redis для каталога магазина."""
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        channel = f"catalog:{slug}"
        payload = json.dumps({"event": event, "data": data})
        await r.publish(channel, payload)
        await r.aclose()
    except Exception:
        await catalog_broadcast(slug, event, data)


async def publish_order_event(order_id: int, event: str, data: dict):
    """Публикуем обновление статуса конкретного заказа."""
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        channel = f"order:{order_id}"
        payload = json.dumps({"event": event, "data": data})
        await r.publish(channel, payload)
        await r.aclose()
    except Exception:
        await catalog_broadcast(f"order:{order_id}", event, data)


async def catalog_subscribe(channel: str, ws: WebSocket):
    """Подписываемся на Redis канал и пересылаем сообщения клиенту."""
    redis_channel = f"catalog:{channel}" if not channel.startswith("order:") else channel
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        pubsub = r.pubsub()
        await pubsub.subscribe(redis_channel)
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode()
                await ws.send_text(data)
    except Exception:
        pass
    finally:
        try:
            await pubsub.unsubscribe(redis_channel)
            await r.aclose()
        except Exception:
            pass
