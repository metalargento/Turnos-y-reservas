"""
Repository de usuarios.
Único punto de acceso a la tabla users para toda la aplicación.
"""
from typing import Optional, Dict, Any
from utils.db import db
from utils.logger import get_logger

logger = get_logger("user_repo")


class UserRepository:
    """
    Repository para la tabla users.

    Todos los métodos devuelven diccionarios o None.
    Las queries usan parámetros para prevenir SQL injection.
    """

    def create(
        self,
        email: str,
        password_hash: str,
        full_name: str,
        role: str
    ) -> Dict[str, Any]:
        """
        Crea un nuevo usuario.

        Args:
            email: Email único del usuario
            password_hash: Password hasheada con bcrypt
            full_name: Nombre completo
            role: 'owner' o 'professional'

        Returns:
            Diccionario con los datos del usuario creado

        Raises:
            Exception si el email ya existe (violación de unique constraint)
        """
        query = """
            INSERT INTO users (email, password_hash, full_name, role)
            VALUES (%s, %s, %s, %s)
            RETURNING id, email, full_name, role, is_active, created_at
        """
        result = db.execute_one(query, (email, password_hash, full_name, role))
        logger.info("Usuario creado", extra={"user_id": result["id"], "email": email})
        return dict(result)

    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Busca un usuario por email.

        Args:
            email: Email a buscar

        Returns:
            Diccionario con datos del usuario o None si no existe
        """
        query = """
            SELECT id, email, password_hash, full_name, role, is_active, created_at
            FROM users
            WHERE email = %s
        """
        result = db.execute_one(query, (email,))
        return dict(result) if result else None

    def find_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca un usuario por ID.

        Args:
            user_id: UUID del usuario

        Returns:
            Diccionario con datos del usuario o None si no existe
        """
        query = """
            SELECT id, email, full_name, role, is_active, created_at
            FROM users
            WHERE id = %s
        """
        result = db.execute_one(query, (user_id,))
        return dict(result) if result else None

    def find_by_id_with_password(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca un usuario por ID incluyendo password_hash.
        Solo para uso interno del auth_service.

        Args:
            user_id: UUID del usuario

        Returns:
            Diccionario con datos del usuario incluyendo password_hash
        """
        query = """
            SELECT id, email, password_hash, full_name, role, is_active, created_at
            FROM users
            WHERE id = %s
        """
        result = db.execute_one(query, (user_id,))
        return dict(result) if result else None

    def update(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Actualiza datos de un usuario.

        Args:
            user_id: UUID del usuario
            data: Diccionario con campos a actualizar

        Returns:
            Diccionario con datos actualizados del usuario
        """
        fields = []
        values = []
        for key, value in data.items():
            fields.append(f"{key} = %s")
            values.append(value)

        values.append(user_id)
        query = f"""
            UPDATE users
            SET {', '.join(fields)}, updated_at = NOW()
            WHERE id = %s
            RETURNING id, email, full_name, role, is_active, created_at
        """
        result = db.execute_one(query, tuple(values))
        return dict(result) if result else None


# Instancia global única
user_repo = UserRepository()
