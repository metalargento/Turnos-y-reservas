"""
Repository de negocios.
Único punto de acceso a la tabla businesses para toda la aplicación.
"""
from typing import Optional, Dict, Any, List
from utils.db import db
from utils.logger import get_logger

logger = get_logger("business_repo")


class BusinessRepository:
    """
    Repository para la tabla businesses.

    Todos los métodos devuelven diccionarios o None.
    Las queries usan parámetros para prevenir SQL injection.
    """

    def create(
        self,
        owner_id: str,
        name: str,
        slug: str,
        rubro: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crea un nuevo negocio.

        Args:
            owner_id: UUID del dueño del negocio
            name: Nombre del negocio
            slug: Slug único para URL pública
            rubro: Rubro del negocio (opcional)
            description: Descripción corta (opcional)

        Returns:
            Diccionario con los datos del negocio creado
        """
        query = """
            INSERT INTO businesses (owner_id, name, slug, rubro, description)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, owner_id, name, slug, rubro, description, plan_status, onboarding_completed, created_at
        """
        result = db.execute_one(
            query,
            (owner_id, name, slug, rubro, description)
        )
        logger.info("Negocio creado", extra={"business_id": result["id"], "slug": slug})
        return dict(result)

    def find_by_id(self, business_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca un negocio por ID.

        Args:
            business_id: UUID del negocio

        Returns:
            Diccionario con datos del negocio o None si no existe
        """
        query = """
            SELECT id, owner_id, name, slug, rubro, description, logo_url,
                   primary_color, secondary_color, plan_status, plan_expires_at,
                   onboarding_completed, email_provider, min_advance_hours,
                   google_calendar_enabled, created_at
            FROM businesses
            WHERE id = %s
        """
        result = db.execute_one(query, (business_id,))
        return dict(result) if result else None

    def find_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """
        Busca un negocio por slug (para página pública de reservas).

        Args:
            slug: Slug del negocio

        Returns:
            Diccionario con datos del negocio o None si no existe
        """
        query = """
            SELECT id, owner_id, name, slug, rubro, description, logo_url,
                   primary_color, secondary_color, plan_status, onboarding_completed,
                   google_calendar_enabled
            FROM businesses
            WHERE slug = %s AND plan_status = 'active'
        """
        result = db.execute_one(query, (slug,))
        return dict(result) if result else None

    def find_by_owner_id(self, owner_id: str) -> List[Dict[str, Any]]:
        """
        Busca todos los negocios de un owner.

        Args:
            owner_id: UUID del owner

        Returns:
            Lista de diccionarios con datos de los negocios
        """
        query = """
            SELECT id, owner_id, name, slug, rubro, description, logo_url,
                   primary_color, secondary_color, plan_status, plan_expires_at,
                   onboarding_completed, email_provider, smtp_host, smtp_port,
                   smtp_user, min_advance_hours, google_calendar_enabled, created_at
            FROM businesses
            WHERE owner_id = %s
            ORDER BY created_at DESC
        """
        results = db.execute_query(query, (owner_id,))
        return [dict(r) for r in results] if results else []

    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Busca un negocio por email del owner (vía join con users).

        Args:
            email: Email del owner

        Returns:
            Diccionario con datos del negocio o None
        """
        query = """
            SELECT b.id, b.owner_id, b.name, b.slug, b.plan_status, b.onboarding_completed
            FROM businesses b
            INNER JOIN users u ON b.owner_id = u.id
            WHERE u.email = %s
        """
        result = db.execute_one(query, (email,))
        return dict(result) if result else None

    def update(self, business_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Actualiza datos de un negocio.

        Args:
            business_id: UUID del negocio
            data: Diccionario con campos a actualizar

        Returns:
            Diccionario con datos actualizados del negocio
        """
        fields = []
        values = []
        for key, value in data.items():
            fields.append(f"{key} = %s")
            values.append(value)

        values.append(business_id)
        query = f"""
            UPDATE businesses
            SET {', '.join(fields)}, updated_at = NOW()
            WHERE id = %s
            RETURNING id, name, slug, onboarding_completed, updated_at
        """
        result = db.execute_one(query, tuple(values))
        return dict(result) if result else None

    def update_brand(self, business_id: str, logo_url: Optional[str],
                     primary_color: str, secondary_color: str) -> Optional[Dict[str, Any]]:
        """
        Actualiza la marca del negocio (logo y colores).

        Args:
            business_id: UUID del negocio
            logo_url: URL del logo (opcional)
            primary_color: Color primario en hex
            secondary_color: Color secundario en hex

        Returns:
            Diccionario con datos actualizados
        """
        query = """
            UPDATE businesses
            SET logo_url = %s, primary_color = %s, secondary_color = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id, logo_url, primary_color, secondary_color
        """
        result = db.execute_one(query, (logo_url, primary_color, secondary_color, business_id))
        return dict(result) if result else None

    def update_agenda_config(
        self,
        business_id: str,
        min_advance_hours: int,
        email_provider: str,
        smtp_host: Optional[str] = None,
        smtp_port: Optional[int] = None,
        smtp_user: Optional[str] = None,
        smtp_password_encrypted: Optional[str] = None,
        google_calendar_enabled: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Actualiza configuración de agenda y emails.

        Args:
            business_id: UUID del negocio
            min_advance_hours: Horas mínimas de anticipación
            email_provider: 'resend' o 'smtp'
            smtp_host: Host del SMTP (si usa smtp propio)
            smtp_port: Puerto del SMTP
            smtp_user: Usuario del SMTP
            smtp_password_encrypted: Password encriptada del SMTP
            google_calendar_enabled: Si activa Google Calendar

        Returns:
            Diccionario con datos actualizados
        """
        query = """
            UPDATE businesses
            SET min_advance_hours = %s,
                email_provider = %s,
                smtp_host = %s,
                smtp_port = %s,
                smtp_user = %s,
                smtp_password_encrypted = %s,
                google_calendar_enabled = %s,
                updated_at = NOW()
            WHERE id = %s
            RETURNING id, email_provider, min_advance_hours, google_calendar_enabled
        """
        result = db.execute_one(
            query,
            (min_advance_hours, email_provider, smtp_host, smtp_port,
             smtp_user, smtp_password_encrypted, google_calendar_enabled, business_id)
        )
        return dict(result) if result else None

    def mark_onboarding_completed(self, business_id: str) -> bool:
        """
        Marca el onboarding como completado.

        Args:
            business_id: UUID del negocio

        Returns:
            True si se actualizó correctamente
        """
        query = """
            UPDATE businesses
            SET onboarding_completed = TRUE, updated_at = NOW()
            WHERE id = %s
        """
        db.execute_query(query, (business_id,), fetch=False)
        logger.info("Onboarding completado", extra={"business_id": business_id})
        return True

    def is_slug_available(self, slug: str) -> bool:
        """
        Verifica si un slug está disponible.

        Args:
            slug: Slug a verificar

        Returns:
            True si está disponible, False si ya existe
        """
        query = "SELECT EXISTS(SELECT 1 FROM businesses WHERE slug = %s)"
        result = db.execute_one(query, (slug,))
        return not result["exists"] if result else True


# Instancia global única
business_repo = BusinessRepository()
