"""
Router para OAuth2 de Google.
Permite que negocios conecten sus cuentas de Gmail para enviar confirmaciones.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config.settings import settings
from repositories.business_repo import business_repo
from services.auth_service import auth_service
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("google_oauth_router")

router = APIRouter(prefix="/api/google-oauth", tags=["Google OAuth"])
security = HTTPBearer()

# Scopes de Gmail que necesitamos
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Extrae el token JWT del header."""
    return credentials.credentials


@router.get("/authorize/{business_id}")
async def get_google_auth_url(
    business_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Genera la URL de autorización de Google.
    El usuario debe visitar esta URL para autorizar el acceso a Gmail.
    """
    try:
        # Verificar que el usuario es owner del negocio
        payload = auth_service.verify_token(token)
        owner_id = payload["sub"]

        business = business_repo.find_by_id(business_id)
        if not business:
            raise AppError(
                message="Negocio no encontrado",
                code="BUSINESS_NOT_FOUND",
                status_code=404,
            )
        if business["owner_id"] != owner_id:
            raise HTTPException(status_code=403, detail="No tenés permiso")

        if not settings.google_client_id or not settings.google_client_secret:
            raise AppError(
                message="Google OAuth no está configurado en el servidor",
                code="GOOGLE_NOT_CONFIGURED",
                status_code=503,
            )

        # Crear flow de OAuth2
        from google_auth_oauthlib.flow import Flow

        flow = Flow.from_client_config(
            {
                "installed": {
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [
                        f"{settings.frontend_url}/settings/google-callback"
                    ],
                }
            },
            scopes=SCOPES,
            state=business_id,
        )

        # Generar URL de autorización
        auth_url, state = flow.authorization_url(access_type="offline", prompt="consent")

        logger.info(f"URL de autorización generada para business {business_id}")

        return {
            "auth_url": auth_url,
            "message": "Visita esta URL para autorizar el acceso a tu Gmail",
        }

    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"Error al generar URL de autorización: {e}")
        raise HTTPException(status_code=500, detail="Error al generar URL")


@router.post("/callback")
async def handle_google_callback(
    code: str = Query(..., description="Código de autorización de Google"),
    state: str = Query(..., description="Business ID"),
    token: str = Depends(get_current_user_token),
):
    """
    Maneja el callback de Google OAuth2.
    Recibe el código de autorización, obtiene los tokens y los guarda en la BD.
    """
    try:
        # Verificar que el usuario es owner del negocio
        payload = auth_service.verify_token(token)
        owner_id = payload["sub"]

        business = business_repo.find_by_id(state)
        if not business:
            raise AppError(
                message="Negocio no encontrado",
                code="BUSINESS_NOT_FOUND",
                status_code=404,
            )
        if business["owner_id"] != owner_id:
            raise HTTPException(status_code=403, detail="No tenés permiso")

        if not settings.google_client_id or not settings.google_client_secret:
            raise AppError(
                message="Google OAuth no está configurado",
                code="GOOGLE_NOT_CONFIGURED",
                status_code=503,
            )

        # Crear flow y obtener tokens
        from google_auth_oauthlib.flow import Flow
        from googleapiclient.discovery import build

        flow = Flow.from_client_config(
            {
                "installed": {
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [
                        f"{settings.frontend_url}/settings/google-callback"
                    ],
                }
            },
            scopes=SCOPES,
            state=state,
        )

        # Obtener token con el código
        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Obtener email del usuario
        gmail_service = build("gmail", "v1", credentials=credentials)
        profile = gmail_service.users().getProfile(userId="me").execute()
        google_email = profile.get("emailAddress")

        # Guardar tokens en la BD
        updated = business_repo.update(
            business_id=state,
            data={
                "google_email": google_email,
                "google_access_token": credentials.token,
                "google_refresh_token": credentials.refresh_token,
                "google_token_expiry": credentials.expiry,
            },
        )

        logger.info(
            f"Google OAuth configurado para negocio {state}",
            extra={"email": google_email},
        )

        return {
            "message": "Gmail conectado exitosamente",
            "email": google_email,
            "business_id": state,
        }

    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"Error al procesar callback de Google: {e}")
        raise HTTPException(status_code=500, detail="Error al procesar callback")


@router.delete("/{business_id}")
async def disconnect_google(
    business_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Desconecta la cuenta de Gmail del negocio.
    """
    try:
        payload = auth_service.verify_token(token)
        owner_id = payload["sub"]

        business = business_repo.find_by_id(business_id)
        if not business:
            raise AppError(
                message="Negocio no encontrado",
                code="BUSINESS_NOT_FOUND",
                status_code=404,
            )
        if business["owner_id"] != owner_id:
            raise HTTPException(status_code=403, detail="No tenés permiso")

        # Limpiar tokens de Google
        business_repo.update(
            business_id=business_id,
            data={
                "google_email": None,
                "google_access_token": None,
                "google_refresh_token": None,
                "google_token_expiry": None,
            },
        )

        logger.info(f"Gmail desconectado para negocio {business_id}")

        return {"message": "Gmail desconectado"}

    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"Error al desconectar Gmail: {e}")
        raise HTTPException(status_code=500, detail="Error al desconectar")
