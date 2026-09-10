import logging
from fastapi import APIRouter, Query, status
from app.schemas.telemetry import TelemetryPayload
from app.services.open_meteo import open_meteo_service

logger = logging.getLogger("agri.api.telemetry")
router = APIRouter()


@router.get(
    "/live",
    response_model=TelemetryPayload,
    status_code=status.HTTP_200_OK,
    summary="Fetch live weather and soil telemetry",
    description="Retrieves multi-depth soil moisture, precipitation forecasts, and ET0 metrics for coordinates.",
)
async def get_live_telemetry(
    latitude: float = Query(..., ge=-90.0, le=90.0, example=8.3114, description="Farm latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, example=80.4037, description="Farm longitude"),
    force_refresh: bool = Query(False, description="Bypass Redis cache and fetch fresh external data"),
) -> TelemetryPayload:
    logger.info(f"Fetching telemetry for ({latitude}, {longitude}), force_refresh={force_refresh}")
    return await open_meteo_service.get_forecast(latitude, longitude, force_refresh=force_refresh)
