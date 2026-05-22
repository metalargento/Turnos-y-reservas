"""
Repository de profesionales.
Único punto de acceso a la tabla professionals para toda la aplicación.
"""
from typing import Optional, Dict, Any, List
from utils.db import db
from utils.logger import get_logger

logger = get_logger("professional_repo")


class ProfessionalRepository:
    """
    Repository para la tabla professionals.

    Todos los métodos devuelven diccionarios o None.
    Las queries usan parámetros para prevenir SQL injection.
    """

    def create(
        self,
        business_id: str,
        display_name: str,
        branch_id: Optional[str] = None,
        user_id: Optional[str] = None,
        avatar_url: Optional[str] = None,
        bio: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Crea un nuevo profesional.

        Args:
            business_id: UUID del negocio
            display_name: Nombre de visualización del profesional
            branch_id: UUID de la sucursal (opcional)
            user_id: UUID del usuario (opcional, si tiene login)
            avatar_url: URL del avatar (opcional)
            bio: Biografía (opcional)

        Returns:
            Diccionario con datos del profesional creado
        """
        query = """
            INSERT INTO professionals
            (business_id, display_name, branch_id, user_id, avatar_url, bio)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, business_id, display_name, branch_id, user_id, avatar_url, bio, is_active, created_at
        """
        result = db.execute_one(
            query,
            (business_id, display_name, branch_id, user_id, avatar_url, bio),
        )
        professional = dict(result)
        professional['services'] = []
        logger.info(
            "Profesional creado",
            extra={"professional_id": professional["id"], "business_id": business_id},
        )
        return professional

    def find_by_id(self, professional_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca un profesional por ID.

        Args:
            professional_id: UUID del profesional

        Returns:
            Diccionario con datos del profesional o None si no existe
        """
        query = """
            SELECT
                p.id,
                p.business_id,
                p.display_name,
                p.branch_id,
                p.user_id,
                p.avatar_url,
                p.bio,
                p.is_active,
                p.created_at,
                COALESCE(json_agg(ps.service_id) FILTER (WHERE ps.service_id IS NOT NULL), '[]'::json) as services
            FROM professionals p
            LEFT JOIN professional_services ps ON p.id = ps.professional_id
            WHERE p.id = %s
            GROUP BY p.id, p.business_id, p.display_name, p.branch_id, p.user_id, p.avatar_url, p.bio, p.is_active, p.created_at
        """
        result = db.execute_one(query, (professional_id,))
        return dict(result) if result else None

    def find_by_business_id(self, business_id: str) -> List[Dict[str, Any]]:
        """
        Busca todos los profesionales activos de un negocio.

        Args:
            business_id: UUID del negocio

        Returns:
            Lista de diccionarios con datos de los profesionales
        """
        query = """
            SELECT
                p.id,
                p.business_id,
                p.display_name,
                p.branch_id,
                p.user_id,
                p.avatar_url,
                p.bio,
                p.is_active,
                p.created_at,
                COALESCE(json_agg(ps.service_id) FILTER (WHERE ps.service_id IS NOT NULL), '[]'::json) as services
            FROM professionals p
            LEFT JOIN professional_services ps ON p.id = ps.professional_id
            WHERE p.business_id = %s AND p.is_active = TRUE
            GROUP BY p.id, p.business_id, p.display_name, p.branch_id, p.user_id, p.avatar_url, p.bio, p.is_active, p.created_at
            ORDER BY p.display_name ASC
        """
        results = db.execute_query(query, (business_id,))
        return [dict(r) for r in results] if results else []

    def update(
        self,
        professional_id: str,
        display_name: Optional[str] = None,
        branch_id: Optional[str] = None,
        avatar_url: Optional[str] = None,
        bio: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Actualiza datos de un profesional.

        Args:
            professional_id: UUID del profesional
            display_name: Nuevo nombre (opcional)
            branch_id: Nueva sucursal (opcional)
            avatar_url: Nuevo avatar (opcional)
            bio: Nueva biografía (opcional)

        Returns:
            Diccionario con datos actualizados del profesional
        """
        fields = []
        values = []

        if display_name:
            fields.append("display_name = %s")
            values.append(display_name)
        if branch_id is not None:
            fields.append("branch_id = %s")
            values.append(branch_id)
        if avatar_url is not None:
            fields.append("avatar_url = %s")
            values.append(avatar_url)
        if bio is not None:
            fields.append("bio = %s")
            values.append(bio)

        if not fields:
            return self.find_by_id(professional_id)

        values.append(professional_id)
        query = f"""
            UPDATE professionals
            SET {', '.join(fields)}, updated_at = NOW()
            WHERE id = %s
            RETURNING id, display_name, branch_id, avatar_url, bio, updated_at
        """
        result = db.execute_one(query, tuple(values))
        if result:
            updated = dict(result)
            services = self.get_services(professional_id)
            updated['services'] = [s['id'] for s in services]
            return updated
        return None

    def set_active(self, professional_id: str, is_active: bool) -> bool:
        """
        Activa o desactiva un profesional.

        Args:
            professional_id: UUID del profesional
            is_active: True para activar, False para desactivar

        Returns:
            True si se actualizó correctamente
        """
        query = """
            UPDATE professionals
            SET is_active = %s, updated_at = NOW()
            WHERE id = %s
        """
        db.execute_query(query, (is_active, professional_id), fetch=False)
        logger.info(
            "Profesional activado/desactivado",
            extra={"professional_id": professional_id, "is_active": is_active},
        )
        return True

    def count_by_business(self, business_id: str) -> int:
        """
        Cuenta cuántos profesionales tiene un negocio.

        Args:
            business_id: UUID del negocio

        Returns:
            Cantidad de profesionales activos
        """
        query = """
            SELECT COUNT(*) as count
            FROM professionals
            WHERE business_id = %s AND is_active = TRUE
        """
        result = db.execute_one(query, (business_id,))
        return result["count"] if result else 0

    def assign_services(
        self, professional_id: str, service_ids: List[str]
    ) -> bool:
        """
        Asigna servicios a un profesional (reemplaza la lista anterior).

        Args:
            professional_id: UUID del profesional
            service_ids: Lista de UUIDs de servicios

        Returns:
            True si se asignaron correctamente
        """
        # Eliminar asignaciones previas
        delete_query = "DELETE FROM professional_services WHERE professional_id = %s"
        db.execute_query(delete_query, (professional_id,), fetch=False)

        # Insertar nuevas asignaciones
        if service_ids:
            insert_query = """
                INSERT INTO professional_services (professional_id, service_id)
                VALUES (%s, %s)
            """
            for service_id in service_ids:
                db.execute_query(
                    insert_query, (professional_id, service_id), fetch=False
                )

        logger.info(
            "Servicios asignados al profesional",
            extra={"professional_id": professional_id, "count": len(service_ids)},
        )
        return True

    def get_services(self, professional_id: str) -> List[Dict[str, Any]]:
        """
        Obtiene los servicios asignados a un profesional.

        Args:
            professional_id: UUID del profesional

        Returns:
            Lista de diccionarios con datos de los servicios
        """
        query = """
            SELECT s.id, s.business_id, s.name, s.description, s.duration_minutes, s.price, s.is_active
            FROM services s
            INNER JOIN professional_services ps ON s.id = ps.service_id
            WHERE ps.professional_id = %s AND s.is_active = TRUE
            ORDER BY s.name ASC
        """
        results = db.execute_query(query, (professional_id,))
        return [dict(r) for r in results] if results else []


# Instancia global única
professional_repo = ProfessionalRepository()
