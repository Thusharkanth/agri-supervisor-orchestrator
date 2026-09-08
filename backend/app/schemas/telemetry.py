from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class HourlyTelemetry(BaseModel):
    time: List[str]
    precipitation_probability: List[int]
    precipitation: List[float]
    soil_moisture_0_to_1cm: Optional[List[float]] = None
    soil_moisture_3_to_9cm: List[float]
    et0_fao_evapotranspiration: Optional[List[float]] = None
    temperature_2m: Optional[List[float]] = None


class TelemetryPayload(BaseModel):
    latitude: float
    longitude: float
    elevation: Optional[float] = None
    timezone: Optional[str] = "UTC"
    hourly: HourlyTelemetry
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
    source: str = "open-meteo"
    cached: bool = False
    staleness_warning: bool = False
