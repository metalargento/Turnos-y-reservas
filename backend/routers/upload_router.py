"""Endpoints para upload de imágenes (logos y avatares)."""
from fastapi import APIRouter, File, UploadFile, HTTPException, Request
from uuid import UUID
from integrations.supabase_storage import get_storage_service
from repositories.business_repo import BusinessRepository
from repositories.professional_repo import ProfessionalRepository
from schemas.upload import UploadResponse
from utils.errors import AppError


router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/logo")
async def upload_logo(
    request: Request,
    file: UploadFile = File(...),
    business_id: str = None,
) -> UploadResponse:
    """Sube logo de negocio. Solo el dueño del negocio puede subir."""
    current_user = request.state.user
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")

    try:
        business_id_uuid = UUID(business_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="business_id inválido")

    # Verificar que el usuario sea dueño del negocio
    business_repo = BusinessRepository()
    business = business_repo.find_by_id(str(business_id_uuid))
    if not business:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    if str(business["owner_id"]) != str(current_user.get("sub")):
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar este negocio")

    # Leer contenido del archivo
    file_content = await file.read()

    # Upload a Supabase Storage
    storage_service = get_storage_service()
    try:
        public_url = storage_service.upload_logo(
            file_content=file_content,
            filename=file.filename or "logo",
            business_id=str(business_id_uuid)
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    # Actualizar BD
    business_repo.update_brand(str(business_id_uuid), public_url,
                               business.get("primary_color", "#000000"),
                               business.get("secondary_color", "#ffffff"))

    return UploadResponse(url=public_url)


@router.post("/avatar")
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    professional_id: str = None,
) -> UploadResponse:
    """Sube avatar de profesional. Solo el profesional o dueño del negocio puede subir."""
    current_user = request.state.user
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")

    try:
        professional_id_uuid = UUID(professional_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="professional_id inválido")

    # Obtener profesional y verificar permisos
    professional_repo = ProfessionalRepository()
    professional = professional_repo.find_by_id(str(professional_id_uuid))
    if not professional:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")

    # Verificar permiso: profesional mismo o dueño del negocio
    business_repo = BusinessRepository()
    business = business_repo.find_by_id(str(professional["business_id"]))

    current_user_id = current_user.get("sub")
    is_owner = business and str(business["owner_id"]) == str(current_user_id)
    is_professional = professional.get("user_id") and str(professional["user_id"]) == str(current_user_id)

    if not (is_owner or is_professional):
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar este avatar")

    # Leer contenido del archivo
    file_content = await file.read()

    # Upload a Supabase Storage
    storage_service = get_storage_service()
    try:
        public_url = storage_service.upload_avatar(
            file_content=file_content,
            filename=file.filename or "avatar",
            professional_id=str(professional_id_uuid)
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    # Actualizar BD
    professional_repo.update(str(professional_id_uuid), avatar_url=public_url)

    return UploadResponse(url=public_url)
