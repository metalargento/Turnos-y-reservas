"""
Servicio de Gmail para enviar emails usando Google OAuth2.
Permite que cada negocio envíe desde su propia cuenta de Gmail.
"""
from typing import Optional
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from utils.logger import get_logger

logger = get_logger("gmail_service")


class GmailService:
    """Servicio para enviar emails con Gmail API."""

    @staticmethod
    def send_email(
        access_token: str,
        refresh_token: Optional[str],
        from_email: str,
        to_email: str,
        subject: str,
        html_body: str,
    ) -> bool:
        """
        Envía un email usando Gmail API.

        Args:
            access_token: Token de acceso OAuth2
            refresh_token: Token de refresh (para renovar access_token si expira)
            from_email: Email remitente
            to_email: Email destinatario
            subject: Asunto del email
            html_body: Cuerpo HTML del email

        Returns:
            True si se envió exitosamente, False si falló
        """
        try:
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
            from googleapiclient.errors import HttpError

            # Crear credenciales
            credentials = Credentials(
                token=access_token,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=None,
                client_secret=None,
            )

            # Intentar refrescar token si está expirado
            try:
                credentials.refresh(Request())
            except Exception as e:
                logger.warning(f"No se pudo refrescar token de Gmail: {e}")

            # Crear servicio de Gmail
            service = build("gmail", "v1", credentials=credentials)

            # Crear mensaje
            message = MIMEMultipart("alternative")
            message["to"] = to_email
            message["from"] = from_email
            message["subject"] = subject

            # Agregar cuerpo HTML
            message.attach(MIMEText(html_body, "html"))

            # Codificar mensaje
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

            # Enviar
            send_message = {"raw": raw_message}
            service.users().messages().send(userId="me", body=send_message).execute()

            logger.info(f"Email enviado exitosamente a {to_email} desde {from_email}")
            return True

        except HttpError as e:
            logger.error(f"Error al enviar email con Gmail API: {e}")
            return False
        except Exception as e:
            logger.error(f"Excepción al enviar email con Gmail: {e}")
            return False


gmail_service = GmailService()
