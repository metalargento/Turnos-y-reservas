"""
Controller de autenticación.
Orquesta el flujo entre el router y el service de auth.
"""
from typing import Dict, Any
from services.auth_service import auth_service
from utils.logger import get_logger

logger = get_logger("auth_controller")


class AuthController:
    """
    Controller de autenticación.

    Orquesta los flujos de registro, login y refresh de tokens.
    No contiene lógica de negocio — delega todo al auth_service.
    """

    def register(
        self,
        email: str,
        password: str,
        full_name: str,
        role: str
    ) -> Dict[str, Any]:
        """
        Registra un nuevo usuario y genera tokens de acceso.

        Args:
            email: Email del usuario
            password: Password en texto plano
            full_name: Nombre completo
            role: 'owner' o 'professional'

        Returns:
            Diccionario con access_token, refresh_token y datos del usuario
        """
        # Registrar usuario
        user = auth_service.register(
            email=email,
            password=password,
            full_name=full_name,
            role=role
        )

        # Generar tokens
        access_token = auth_service._create_access_token(user["id"])
        refresh_token = auth_service._create_refresh_token(user["id"])

        logger.info("Registro completado", extra={"user_id": user["id"], "email": email})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user
        }

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Inicia sesión de un usuario.

        Args:
            email: Email del usuario
            password: Password en texto plano

        Returns:
            Diccionario con access_token, refresh_token y datos del usuario
        """
        return auth_service.login(email=email, password=password)

    def refresh_tokens(self, refresh_token: str) -> Dict[str, Any]:
        """
        Genera nuevos tokens usando un refresh token válido.

        Args:
            refresh_token: Refresh token previo

        Returns:
            Diccionario con nuevo access_token y refresh_token
        """
        return auth_service.refresh_tokens(refresh_token=refresh_token)

    def get_current_user(self, user_id: str) -> Dict[str, Any]:
        """
        Obtiene datos del usuario autenticado.

        Args:
            user_id: ID del usuario desde el token

        Returns:
            Datos del usuario (sin password)
        """
        from repositories.user_repo import user_repo
        user = user_repo.find_by_id(user_id)

        if not user:
            from utils.errors import AppError
            raise AppError("Usuario no encontrado", "USER_NOT_FOUND", 404)

        return user


# Instancia global única
auth_controller = AuthController()
