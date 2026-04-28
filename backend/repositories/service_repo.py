"""
Repository de servicios.
Único punto de acceso a la tabla services para toda la aplicación.
"""
from typing import Optional, Dict, Any, List
from utils.db import db
from utils.logger import get_logger

logger = get_logger("service_repo")


class ServiceRepository:
    """
    Repository para la tabla services.

    Todos los métodos devuelven diccionarios o None.
    Las queries usan parámetros para prevenir SQL injection.
    """

    def create(
        self,
        business_id: str,
        name: str,
        duration_minutes: int,
        description: Optional[str] = None,
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Crea un nuevo servicio.

        Args:
            business_id: UUID del negocio
            name: Nombre del servicio
            duration_minutes: Duración en minutos
            description: Descripción del servicio (opcional)
            price: Precio del servicio (opcional)

        Returns:
            Diccionario con los datos del servicio creado
        """
        query = """
            INSERT INTO services (business_id, name, description, duration_minutes, price)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, business_id, name, description, duration_minutes, price, is_active, created_at
        """
        result = db.execute_one(
            query,
            (business_id, name, description, duration_minutes, price)
        )
        logger.info(
            "Servicio creado",
            extra={"service_id": result["id"], "business_id": business_id, "name": name}
        )
        return dict(result)

    def create_many(
        self,
        business_id: str,
        services_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Crea múltiples servicios de una vez.

        Args:
            business_id: UUID del negocio
            services_data: Lista de diccionarios con datos de servicios

        Returns:
            Lista de servicios creados
        """
        created_services = []
        for service_data in services_data:
            service = self.create(
                business_id=business_id,
                name=service_data["name"],
                duration_minutes=service_data["duration_minutes"],
                description=service_data.get("description"),
                price=service_data.get("price")
            )
            created_services.append(service)
        return created_services

    def find_by_id(self, service_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca un servicio por ID.

        Args:
            service_id: UUID del servicio

        Returns:
            Diccionario con datos del servicio o None si no existe
        """
        query = """
            SELECT id, business_id, name, description, duration_minutes, price, is_active, created_at
            FROM services
            WHERE id = %s
        """
        result = db.execute_one(query, (service_id,))
        return dict(result) if result else None

    def find_by_business_id(self, business_id: str) -> List[Dict[str, Any]]:
        """
        Busca todos los servicios de un negocio.

        Args:
            business_id: UUID del negocio

        Returns:
            Lista de diccionarios con datos de los servicios
        """
        query = """
            SELECT id, business_id, name, description, duration_minutes, price, is_active, created_at
            FROM services
            WHERE business_id = %s AND is_active = TRUE
            ORDER BY name ASC
        """
        results = db.execute_query(query, (business_id,))
        return [dict(r) for r in results] if results else []

    def update(
        self,
        service_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        duration_minutes: Optional[int] = None,
        price: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Actualiza datos de un servicio.

        Args:
            service_id: UUID del servicio
            name: Nuevo nombre (opcional)
            description: Nueva descripción (opcional)
            duration_minutes: Nueva duración (opcional)
            price: Nuevo precio (opcional)

        Returns:
            Diccionario con datos actualizados del servicio
        """
        fields = []
        values = []

        if name:
            fields.append("name = %s")
            values.append(name)
        if description:
            fields.append("description = %s")
            values.append(description)
        if duration_minutes is not None:
            fields.append("duration_minutes = %s")
            values.append(duration_minutes)
        if price is not None:
            fields.append("price = %s")
            values.append(price)

        if not fields:
            return self.find_by_id(service_id)

        values.append(service_id)
        query = f"""
            UPDATE services
            SET {', '.join(fields)}, updated_at = NOW()
            WHERE id = %s
            RETURNING id, name, duration_minutes, price, updated_at
        """
        result = db.execute_one(query, tuple(values))
        return dict(result) if result else None

    def set_active(self, service_id: str, is_active: bool) -> bool:
        """
        Activa o desactiva un servicio.

        Args:
            service_id: UUID del servicio
            is_active: True para activar, False para desactivar

        Returns:
            True si se actualizó correctamente
        """
        query = """
            UPDATE services
            SET is_active = %s, updated_at = NOW()
            WHERE id = %s
        """
        db.execute_query(query, (is_active, service_id), fetch=False)
        logger.info(
            "Servicio activado/desactivado",
            extra={"service_id": service_id, "is_active": is_active}
        )
        return True

    def count_by_business(self, business_id: str) -> int:
        """
        Cuenta cuántos servicios tiene un negocio.

        Args:
            business_id: UUID del negocio

        Returns:
            Cantidad de servicios activos
        """
        query = """
            SELECT COUNT(*) as count
            FROM services
            WHERE business_id = %s AND is_active = TRUE
        """
        result = db.execute_one(query, (business_id,))
        return result["count"] if result else 0


# Instancia global única
service_repo = ServiceRepository()
