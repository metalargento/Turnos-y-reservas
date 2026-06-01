"""Schemas para upload de imágenes."""
from pydantic import BaseModel


class UploadLogoRequest(BaseModel):
    """Request para upload de logo de negocio."""
    business_id: str


class UploadAvatarRequest(BaseModel):
    """Request para upload de avatar de profesional."""
    professional_id: str


class UploadResponse(BaseModel):
    """Response estándar para upload."""
    url: str
    message: str = "Archivo subido correctamente"
