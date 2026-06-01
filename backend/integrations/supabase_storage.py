"""
Integración con Supabase Storage para upload de imágenes.
"""
import uuid
from typing import Optional
from config.settings import settings
from utils.errors import AppError


class SupabaseStorageService:
    """Servicio para upload de archivos a Supabase Storage."""

    ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

    def __init__(self):
        if not settings.supabase_url or not settings.supabase_key:
            raise AppError(
                message="Variables de entorno SUPABASE_URL y SUPABASE_KEY no configuradas",
                code="SUPABASE_CONFIG_ERROR",
                status_code=500
            )

        try:
            from supabase import create_client
            self.client = create_client(settings.supabase_url, settings.supabase_key)
        except ImportError as e:
            raise AppError(
                message="Librería supabase no instalada",
                code="SUPABASE_IMPORT_ERROR",
                status_code=500
            )
        except Exception as e:
            raise AppError(
                message=f"Error al conectar a Supabase: {str(e)}",
                code="SUPABASE_CONNECTION_ERROR",
                status_code=500
            )

    def upload_logo(self, file_content: bytes, filename: str, business_id: str) -> str:
        """Sube logo de negocio a Supabase Storage.

        Args:
            file_content: Contenido del archivo
            filename: Nombre original del archivo
            business_id: ID del negocio

        Returns:
            URL pública del archivo

        Raises:
            AppError: Si el archivo es inválido o falla el upload
        """
        return self._upload_file(
            file_content=file_content,
            filename=filename,
            entity_id=business_id,
            bucket="logos"
        )

    def upload_avatar(self, file_content: bytes, filename: str, professional_id: str) -> str:
        """Sube avatar de profesional a Supabase Storage.

        Args:
            file_content: Contenido del archivo
            filename: Nombre original del archivo
            professional_id: ID del profesional

        Returns:
            URL pública del archivo

        Raises:
            AppError: Si el archivo es inválido o falla el upload
        """
        return self._upload_file(
            file_content=file_content,
            filename=filename,
            entity_id=professional_id,
            bucket="avatars"
        )

    def _upload_file(
        self,
        file_content: bytes,
        filename: str,
        entity_id: str,
        bucket: str
    ) -> str:
        """Upload genérico de archivo a Supabase Storage.

        Args:
            file_content: Contenido del archivo
            filename: Nombre original
            entity_id: ID de la entidad (business_id o professional_id)
            bucket: Nombre del bucket (logos o avatars)

        Returns:
            URL pública del archivo

        Raises:
            AppError: Si validación o upload falla
        """
        # Validar tamaño
        if len(file_content) > self.MAX_FILE_SIZE:
            raise AppError(
                message="El archivo no puede superar 5MB",
                code="FILE_TOO_LARGE",
                status_code=400
            )

        # Validar MIME type (sin confiar en la extensión)
        try:
            import magic
            mime_type = magic.from_buffer(file_content, mime=True)
        except ImportError:
            # Fallback: validar por extensión
            ext = filename.split(".")[-1].lower()
            mime_types = {
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "png": "image/png",
                "webp": "image/webp"
            }
            mime_type = mime_types.get(ext, "application/octet-stream")

        if mime_type not in self.ALLOWED_MIME_TYPES:
            raise AppError(
                message="Solo se permiten imágenes (JPEG, PNG, WebP)",
                code="INVALID_FILE_TYPE",
                status_code=400
            )

        # Generar nombre único
        ext = filename.split(".")[-1].lower()
        unique_filename = f"{entity_id}/{uuid.uuid4()}.{ext}"

        try:
            # Upload a Supabase Storage
            self.client.storage.from_(bucket).upload(
                path=unique_filename,
                file=file_content,
                file_options={
                    "content-type": mime_type,
                    "cacheControl": "3600"
                }
            )

            # Obtener URL pública
            public_url = self.client.storage.from_(bucket).get_public_url(unique_filename)
            return public_url

        except Exception as e:
            raise AppError(
                message=f"Error al subir archivo: {str(e)}",
                code="UPLOAD_FAILED",
                status_code=500
            )


# Instancia global (lazy initialization)
_storage_service: Optional[SupabaseStorageService] = None


def get_storage_service() -> SupabaseStorageService:
    """Retorna instancia del servicio de storage (lazy initialization)."""
    global _storage_service
    if _storage_service is None:
        _storage_service = SupabaseStorageService()
    return _storage_service
