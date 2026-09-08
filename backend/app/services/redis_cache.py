import json
import logging
import time
from typing import Optional, Any
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("agri.redis")

# In-memory fallback dictionary with timestamps if Redis container is unreachable
_memory_cache: dict[str, tuple[float, str]] = {}


class RedisCacheService:
    def __init__(self):
        self.host = settings.REDIS_HOST
        self.port = settings.REDIS_PORT
        self.default_ttl = settings.REDIS_TTL_SECONDS
        self._client: Optional[aioredis.Redis] = None

    async def get_client(self) -> Optional[aioredis.Redis]:
        if self._client is None:
            try:
                self._client = aioredis.Redis(
                    host=self.host,
                    port=self.port,
                    decode_responses=True,
                    socket_connect_timeout=2.0,
                    socket_timeout=2.0,
                )
                # Test connectivity
                await self._client.ping()
            except Exception as e:
                logger.warning(f"Redis unavailable ({e}). Using in-memory fallback cache.")
                self._client = None
        return self._client

    @staticmethod
    def format_telemetry_key(latitude: float, longitude: float) -> str:
        """Standardized composite key: telemetry:{latitude:.4f}:{longitude:.4f}"""
        return f"telemetry:{latitude:.4f}:{longitude:.4f}"

    async def get(self, key: str) -> Optional[str]:
        client = await self.get_client()
        if client:
            try:
                return await client.get(key)
            except Exception as e:
                logger.warning(f"Redis get failed for {key}: {e}. Falling back to memory cache.")

        # Fallback to memory cache
        if key in _memory_cache:
            expiry, value = _memory_cache[key]
            if time.time() < expiry:
                return value
            del _memory_cache[key]
        return None

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        ttl = ex if ex is not None else self.default_ttl
        client = await self.get_client()
        if client:
            try:
                await client.set(key, value, ex=ttl)
                return True
            except Exception as e:
                logger.warning(f"Redis set failed for {key}: {e}. Saving to memory cache.")

        # Fallback to memory cache
        _memory_cache[key] = (time.time() + ttl, value)
        return True

    async def get_json(self, key: str) -> Optional[dict]:
        data = await self.get(key)
        if data:
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                return None
        return None

    async def set_json(self, key: str, payload: Any, ex: Optional[int] = None) -> bool:
        serialized = json.dumps(payload, default=str)
        return await self.set(key, serialized, ex=ex)

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None


redis_cache = RedisCacheService()
