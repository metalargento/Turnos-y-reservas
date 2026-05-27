"""
Schemas para bloqueos de agenda (schedule_blocks).
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from schemas.common import BaseSchema
from datetime import datetime


class ScheduleBlockCreateRequest(BaseSchema):
    """Crear un bloqueo de agenda."""
    blocked_from: str = Field(description="ISO 8601 timestamp (ej: 2026-05-10T00:00:00-03:00)")
    blocked_until: str = Field(description="ISO 8601 timestamp (ej: 2026-05-20T23:59:59-03:00)")
    reason: Optional[str] = Field(default=None, max_length=500)


class ScheduleBlockResponse(BaseSchema):
    """Respuesta de bloqueo de agenda."""
    id: str
    professional_id: str
    blocked_from: str
    blocked_until: str
    reason: Optional[str]
    created_by: Optional[str]
    created_at: Optional[str]


class ScheduleBlocksListResponse(BaseSchema):
    """Respuesta con lista de bloqueos."""
    blocks: List[ScheduleBlockResponse]
    count: int
