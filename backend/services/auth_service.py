"""
Servicio de autenticación.
Toda la lógica de negocio relacionada con registro, login y gestión de tokens.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from config.settings import settings
from repositories.user_repo import user_repo
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("auth_service")


# Configuración de password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Algoritmo JWT
ALGORITHM = "HS256"


class AuthService:
    """
    Servicio de autenticación.

    Maneja registro, login, hash de passwords y generación/validación de tokens JWT.
    No accede directamente a la DB — usa user_repo.
    """

    def register(
        self,
        email: str,
        password: str,
        full_name: str,
        role: str
    ) -> Dict[str, Any]:
        """
        Registra un nuevo usuario.

        Args:
            email: Email único del usuario
            password: Password en texto plano (será hasheada)
            full_name: Nombre completo
            role: 'owner' o 'professional'

        Returns:
            Diccionario con datos del usuario (sin password)

        Raises:
            AppError: code 'EMAIL_ALREADY_EXISTS' si el email ya está registrado
        """
        # Verificar si el email ya existe
        existing_user = user_repo.find_by_email(email)
        if existing_user:
            logger.warning("Intento de registro con email duplicado", extra={"email": email})
            raise AppError("El email ya está registrado", "EMAIL_ALREADY_EXISTS", 409)

        # Hashear password
        password_hash = pwd_context.hash(password)

        # Crear usuario
        user = user_repo.create(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role=role
        )

        logger.info("Usuario registrado", extra={"user_id": user["id"], "email": email, "role": role})

        # Remover password_hash de la respuesta
        user.pop("password_hash", None)
        return user

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Inicia sesión de un usuario.

        Args:
            email: Email del usuario
            password: Password en texto plano

        Returns:
            Diccionario con access_token, refresh_token y datos del usuario

        Raises:
            AppError: code 'INVALID_CREDENTIALS' si las credenciales son inválidas
            AppError: code 'USER_NOT_ACTIVE' si el usuario está inactivo
        """
        # Buscar usuario por email (incluye password_hash)
        user = user_repo.find_by_email(email)
        if not user:
            logger.warning("Login fallido - usuario no encontrado", extra={"email": email})
            raise AppError("Credenciales inválidas", "INVALID_CREDENTIALS", 401)

        # Verificar password
        if not pwd_context.verify(password, user["password_hash"]):
            logger.warning("Login fallido - password incorrecta", extra={"email": email})
            raise AppError("Credenciales inválidas", "INVALID_CREDENTIALS", 401)

        # Verificar que el usuario está activo
        if not user.get("is_active", True):
            logger.warning("Login fallido - usuario inactivo", extra={"email": email})
            raise AppError("Usuario inactivo", "USER_NOT_ACTIVE", 403)

        # Generar tokens
        access_token = self._create_access_token(str(user["id"]))
        refresh_token = self._create_refresh_token(str(user["id"]))

        logger.info("Login exitoso", extra={"user_id": user["id"], "email": email})

        # Remover password_hash de la respuesta
        user_data = {k: v for k, v in user.items() if k != "password_hash"}

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user_data
        }

    def refresh_tokens(self, refresh_token: str) -> Dict[str, Any]:
        """
        Genera nuevos tokens usando un refresh token válido.

        Args:
            refresh_token: Refresh token previo

        Returns:
            Diccionario con nuevo access_token y refresh_token (rotación)

        Raises:
            AppError: code 'INVALID_TOKEN' si el token es inválido
            AppError: code 'TOKEN_TYPE_MISMATCH' si no es un refresh token
        """
        try:
            payload = jwt.decode(refresh_token, settings.jwt_secret, algorithms=[ALGORITHM])
        except JWTError:
            logger.warning("Refresh token inválido")
            raise AppError("Token inválido", "INVALID_TOKEN", 401)

        # Verificar que es un refresh token
        if payload.get("type") != "refresh":
            logger.warning("Token type mismatch en refresh")
            raise AppError("Token inválido", "TOKEN_TYPE_MISMATCH", 401)

        user_id = payload.get("sub")
        if not user_id:
            raise AppError("Token inválido", "INVALID_TOKEN", 401)

        # Verificar que el usuario existe y está activo
        user = user_repo.find_by_id(user_id)
        if not user or not user.get("is_active", True):
            logger.warning("Refresh token de usuario inactivo o inexistente")
            raise AppError("Token inválido", "INVALID_TOKEN", 401)

        # Generar nuevos tokens (rotación)
        new_access_token = self._create_access_token(user_id)
        new_refresh_token = self._create_refresh_token(user_id)

        logger.info("Tokens refreshados", extra={"user_id": user_id})

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }

    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verifica un token JWT y devuelve el payload.

        Args:
            token: Token JWT a verificar

        Returns:
            Payload del token con user_id

        Raises:
            AppError: code 'INVALID_TOKEN' si el token es inválido o expiró
        """
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            logger.warning("Token inválido en verificación")
            raise AppError("Token inválido", "INVALID_TOKEN", 401)

    def _create_access_token(self, user_id: str) -> str:
        """Crea un access token con expiración corta."""
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiration_minutes)
        payload = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "access"
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)

    def _create_refresh_token(self, user_id: str) -> str:
        """Crea un refresh token con expiración larga."""
        expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expiration_days)
        payload = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "refresh"
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


# Instancia global única
auth_service = AuthService()
