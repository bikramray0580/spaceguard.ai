from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from ..config import DEFAULT_STEP_MINUTES
 
 
class ScreenRequest(BaseModel):
    object_a: str
    object_b: str
    start: datetime
    end: datetime
    step_minutes: float = Field(default=DEFAULT_STEP_MINUTES, gt=0)
 
    @field_validator("start", "end")
    @classmethod
    def require_aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamp must be timezone-aware (use UTC)")
        return value
 
 
class MLPrediction(BaseModel):
    risk_probability: float
    risk_score: int
    risk_category: str


class RiskFactor(BaseModel):
    name: str
    value: str
    severity: str
    reason: str


class RiskExplanation(BaseModel):
    summary: str
    factors: list[RiskFactor]
    primary_risk_drivers: list[str]
 
 
class ConjunctionResponse(BaseModel):
    object_a: str
    object_b: str
    time_of_closest_approach: datetime
    miss_distance_km: float
    relative_velocity_km_s: float
    risk_level: str
    risk_reason: str
    risk_explanation: RiskExplanation
    ml_prediction: MLPrediction
