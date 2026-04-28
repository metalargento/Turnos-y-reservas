"""
Repository de sucursales.
Único punto de acceso a la tabla branches para toda la aplicación.
"""
from typing import Optional, Dict, Any, List
from utils.db import db
from utils.logger import get_logger

logger = get_logger("branch_repo")


class BranchRepository:
    """
    Repository para la tabla branches.

    Todos los métodos devuelven diccionarios o None.
    Las queries usan parámetros para prevenir SQL injection.
    """

    def create(
        self,
        business_id: str,
        name: str,
        address: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crea una nueva sucursal.

        Args:
            business_id: UUID del negocio
            name: Nombre de la sucursal
            address: Dirección física (opcional)
            phone: Teléfono de contacto (opcional)

        Returns:
            Diccionario con los datos de la sucursal creada
        """
        query = """
            INSERT INTO branches (business_id, name, address, phone)
            VALUES (%s, %s, %s, %s)
            RETURNING id, business_id, name, address, phone, is_active, created_at
        """
        result = db.execute_one(query, (business_id, name, address, phone))
        logger.info(
            "Sucursal creada",
            extra={"branch_id": result["id"], "business_id": business_id, "name": name}
        )
        return dict(result)

    def find_by_id(self, branch_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca una sucursal por ID.

        Args:
            branch_id: UUID de la sucursal

        Returns:
            Diccionario con datos de la sucursal o None si no existe
        """
        query = """
            SELECT id, business_id, name, address, phone, is_active, created_at
            FROM branches
            WHERE id = %s
        """
        result = db.execute_one(query, (branch_id,))
        return dict(result) if result else None

    def find_by_business_id(self, business_id: str) -> List[Dict[str, Any]]:
        """
        Busca todas las sucursales de un negocio.

        Args:
            business_id: UUID del negocio

        Returns:
            Lista de diccionarios con datos de las sucursales
        """
        query = """
            SELECT id, business_id, name, address, phone, is_active, created_at
            FROM branches
            WHERE business_id = %s AND is_active = TRUE
            ORDER BY created_at ASC
        """
        results = db.execute_query(query, (business_id,))
        return [dict(r) for r in results] if results else []

    def update(
        self,
        branch_id: str,
        name: Optional[str] = None,
        address: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Actualiza datos de una sucursal.

        Args:
            branch_id: UUID de la sucursal
            name: Nuevo nombre (opcional)
            address: Nueva dirección (opcional)
            phone: Nuevo teléfono (opcional)

        Returns:
            Diccionario con datos actualizados de la sucursal
        """
        fields = []
        values = []

        if name:
            fields.append("name = %s")
            values.append(name)
        if address:
            fields.append("address = %s")
            values.append(address)
        if phone:
            fields.append("phone = %s")
            values.append(phone)

        if not fields:
            return self.find_by_id(branch_id)

        values.append(branch_id)
        query = f"""
            UPDATE branches
            SET {', '.join(fields)}, updated_at = NOW()
            WHERE id = %s
            RETURNING id, name, address, phone, updated_at
        """
        result = db.execute_one(query, tuple(values))
        return dict(result) if result else None

    def set_active(self, branch_id: str, is_active: bool) -> bool:
        """
        Activa o desactiva una sucursal.

        Args:
            branch_id: UUID de la sucursal
            is_active: True para activar, False para desactivar

        Returns:
            True si se actualizó correctamente
        """
        query = """
            UPDATE branches
            SET is_active = %s, updated_at = NOW()
            WHERE id = %s
        """
        db.execute_query(query, (is_active, branch_id), fetch=False)
        logger.info(
            "Sucursal activada/desactivada",
            extra={"branch_id": branch_id, "is_active": is_active}
        )
        return True

    def count_by_business(self, business_id: str) -> int:
        """
        Cuenta cuántas sucursales tiene un negocio.

        Args:
            business_id: UUID del negocio

        Returns:
            Cantidad de sucursales
        """
        query = """
            SELECT COUNT(*) as count
            FROM branches
            WHERE business_id = %s AND is_active = TRUE
        """
        result = db.execute_one(query, (business_id,))
        return result["count"] if result else 0


# Instancia global única
branch_repo = BranchRepository()
