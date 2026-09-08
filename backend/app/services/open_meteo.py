import logging
from datetime import datetime, timezone
from typing import Optional
import httpx
from app.core.config import settings
from app.schemas.telemetry import TelemetryPayload, HourlyTelemetry
from app.services.redis_cache import redis_cache

logger = logging.getLogger("agri.open_meteo")


class OpenMeteoService:
    def __init__(self):
        self.base_url = settings.OPEN_METEO_BASE_URL

    async def get_forecast(self, latitude: float, longitude: float, force_refresh: bool = False) -> TelemetryPayload:
        """
        Fetch forecast and multi-depth soil moisture data for coordinates.
        Checks Redis cache first before calling external API.
        """
        cache_key = redis_cache.format_telemetry_key(latitude, longitude)

        # 1. Check Redis Cache
        if not force_refresh:
            cached_data = await redis_cache.get_json(cache_key)
            if cached_data:
                logger.info(f"Telemetry cache HIT for ({latitude:.4f}, {longitude:.4f})")
                try:
                    payload = TelemetryPayload(**cached_data)
                    payload.cached = True
                    return payload
                except Exception as e:
                    logger.warning(f"Failed to parse cached telemetry: {e}")

        # 2. Call Open-Meteo API
        logger.info(f"Fetching fresh telemetry from Open-Meteo for ({latitude:.4f}, {longitude:.4f})")
        endpoint = f"{self.base_url}/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "precipitation_probability,precipitation,soil_moisture_0_to_1cm,soil_moisture_3_to_9cm,et0_fao_evapotranspiration,temperature_2m",
            "forecast_days": 2,
            "timezone": "auto",
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(endpoint, params=params)
                response.raise_for_status()
                data = response.json()

                hourly_data = HourlyTelemetry(
                    time=data["hourly"]["time"],
                    precipitation_probability=data["hourly"]["precipitation_probability"],
                    precipitation=data["hourly"]["precipitation"],
                    soil_moisture_0_to_1cm=data["hourly"].get("soil_moisture_0_to_1cm"),
                    soil_moisture_3_to_9cm=data["hourly"]["soil_moisture_3_to_9cm"],
                    et0_fao_evapotranspiration=data["hourly"].get("et0_fao_evapotranspiration"),
                    temperature_2m=data["hourly"].get("temperature_2m"),
                )

                payload = TelemetryPayload(
                    latitude=data.get("latitude", latitude),
                    longitude=data.get("longitude", longitude),
                    elevation=data.get("elevation"),
                    timezone=data.get("timezone", "UTC"),
                    hourly=hourly_data,
                    fetched_at=datetime.now(timezone.utc),
                    source="open-meteo",
                    cached=False,
                    staleness_warning=False,
                )

                # Store in Redis with 1-hour TTL
                await redis_cache.set_json(cache_key, payload.model_dump(), ex=settings.REDIS_TTL_SECONDS)
                return payload

        except Exception as exc:
            logger.error(f"Open-Meteo API error ({exc}). Applying SLA degradation fallback rules.")
            return self._build_degraded_fallback(latitude, longitude, str(exc))

    def _build_degraded_fallback(self, latitude: float, longitude: float, error_detail: str) -> TelemetryPayload:
        """
        Graceful fallback when Open-Meteo is unreachable.
        Generates safe default telemetry packet with staleness_warning: True.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        hours = [f"{now_iso[:13]}:00" for _ in range(24)]
        
        fallback_hourly = HourlyTelemetry(
            time=hours,
            precipitation_probability=[0] * 24,
            precipitation=[0.0] * 24,
            soil_moisture_0_to_1cm=[0.25] * 24,
            soil_moisture_3_to_9cm=[0.25] * 24,
            et0_fao_evapotranspiration=[3.5] * 24,
            temperature_2m=[28.0] * 24,
        )

        return TelemetryPayload(
            latitude=latitude,
            longitude=longitude,
            hourly=fallback_hourly,
            fetched_at=datetime.now(timezone.utc),
            source=f"fallback-degraded: {error_detail}",
            cached=False,
            staleness_warning=True,
        )


open_meteo_service = OpenMeteoService()
