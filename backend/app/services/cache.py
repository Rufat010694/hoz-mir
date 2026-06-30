"""Simple Redis cache helpers."""
import json
import redis.asyncio as aioredis
from app.config import settings

TTL_SHORT = 60      # 1 мин — товары/категории каталога
TTL_STORE = 300     # 5 мин — инфо о магазине


async def _get_redis():
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)


async def cache_get(key: str):
    try:
        r = await _get_redis()
        val = await r.get(key)
        await r.aclose()
        return json.loads(val) if val else None
    except Exception:
        return None


async def cache_set(key: str, value, ttl: int = TTL_SHORT):
    try:
        r = await _get_redis()
        await r.set(key, json.dumps(value, default=str), ex=ttl)
        await r.aclose()
    except Exception:
        pass


async def cache_delete(key: str):
    try:
        r = await _get_redis()
        await r.delete(key)
        await r.aclose()
    except Exception:
        pass


async def cache_invalidate_store(slug: str):
    """Инвалидируем весь кэш магазина при изменении товара/категории."""
    try:
        r = await _get_redis()
        keys = await r.keys(f"catalog:{slug}:*")
        if keys:
            await r.delete(*keys)
        await r.aclose()
    except Exception:
        pass


async def cache_invalidate_user(user_id: int):
    """Инвалидируем кэш по user_id (нужен slug — ищем по паттерну)."""
    try:
        r = await _get_redis()
        keys = await r.keys(f"user:{user_id}:slug")
        if keys:
            slug = await r.get(keys[0])
            if slug:
                await cache_invalidate_store(slug)
        await r.aclose()
    except Exception:
        pass
