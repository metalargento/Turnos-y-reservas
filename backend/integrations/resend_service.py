"""
Servicio de email transaccional usando Resend y/o Gmail.
Maneja envío de confirmaciones y cancelaciones de reservas.
Intenta usar Gmail del negocio primero, fallback a Resend.
"""
from typing import Optional
import os
import resend
from config.settings import settings
from integrations.gmail_service import gmail_service
from utils.logger import get_logger

logger = get_logger("resend_service")

# Configurar API key de Resend si está disponible
if settings.resend_api_key:
    os.environ['RESEND_API_KEY'] = settings.resend_api_key


class ResendService:
    """Servicio de email usando Resend y/o Gmail."""

    @staticmethod
    def is_configured() -> bool:
        """Verifica si hay algún servicio de email configurado."""
        return settings.resend_api_key is not None
    
    @staticmethod
    def send_with_gmail(
        google_access_token: str,
        google_refresh_token: Optional[str],
        google_email: str,
        client_email: str,
        subject: str,
        html_body: str,
    ) -> bool:
        """Intenta enviar con Gmail si está disponible."""
        if not google_access_token or not google_email:
            return False
        
        return gmail_service.send_email(
            access_token=google_access_token,
            refresh_token=google_refresh_token,
            from_email=google_email,
            to_email=client_email,
            subject=subject,
            html_body=html_body,
        )

    @staticmethod
    def send_booking_confirmation(
        client_email: str,
        client_name: str,
        business_name: str,
        service_name: str,
        professional_name: str,
        starts_at: str,
        confirmation_token: str,
        confirmation_link: str,
        google_access_token: Optional[str] = None,
        google_refresh_token: Optional[str] = None,
        google_email: Optional[str] = None,
    ) -> bool:
        """
        Envía email de confirmación de reserva.
        Intenta Gmail primero, luego Resend como fallback.

        Retorna True si se envió exitosamente, False si no está configurado.
        """
        # Intentar Gmail primero si está disponible
        if google_email and google_access_token:
            from datetime import datetime
            booking_date = datetime.fromisoformat(starts_at)
            date_str = booking_date.strftime("%d/%m/%Y")
            time_str = booking_date.strftime("%H:%M")

            subject = f"✅ Tu reserva en {business_name} está confirmada"
            html = _get_confirmation_html(
                client_name, business_name, service_name, professional_name,
                date_str, time_str, confirmation_link
            )

            success = ResendService.send_with_gmail(
                google_access_token=google_access_token,
                google_refresh_token=google_refresh_token,
                google_email=google_email,
                client_email=client_email,
                subject=subject,
                html_body=html,
            )
            
            if success:
                return True
            else:
                logger.warning(f"Falló envío con Gmail, usando Resend como fallback")
        
        # Fallback a Resend
        if not ResendService.is_configured():
            logger.warning("Resend no está configurado. Email de confirmación no enviado.")
            return False

        try:
            from datetime import datetime
            booking_date = datetime.fromisoformat(starts_at)
            date_str = booking_date.strftime("%d/%m/%Y")
            time_str = booking_date.strftime("%H:%M")

            subject = f"✅ Tu reserva en {business_name} está confirmada"
            html = _get_confirmation_html(
                client_name, business_name, service_name, professional_name,
                date_str, time_str, confirmation_link
            )

            email_data = {
                "from": settings.email_from,
                "to": client_email,
                "subject": subject,
                "html": html,
            }

            response = resend.Emails.send(email_data)

            if response.get("id"):
                logger.info(f"Email de confirmación enviado a {client_email} (ID: {response['id']})")
                return True
            else:
                logger.error(f"Error enviando email a {client_email}: {response}")
                return False

        except Exception as e:
            logger.error(f"Excepción al enviar email de confirmación: {e}")
            return False

    @staticmethod
    def send_booking_cancellation(
        client_email: str,
        client_name: str,
        business_name: str,
        service_name: str,
        professional_name: str,
        starts_at: str,
        cancellation_reason: Optional[str] = None,
        google_access_token: Optional[str] = None,
        google_refresh_token: Optional[str] = None,
        google_email: Optional[str] = None,
    ) -> bool:
        """
        Envía email de cancelación de reserva.
        Intenta Gmail primero, luego Resend como fallback.

        Retorna True si se envió exitosamente, False si no está configurado.
        """
        # Intentar Gmail primero si está disponible
        if google_email and google_access_token:
            from datetime import datetime
            booking_date = datetime.fromisoformat(starts_at)
            date_str = booking_date.strftime("%d/%m/%Y")
            time_str = booking_date.strftime("%H:%M")

            subject = f"❌ Tu reserva en {business_name} fue cancelada"
            html = _get_cancellation_html(
                client_name, business_name, service_name, professional_name,
                date_str, time_str, cancellation_reason
            )

            success = ResendService.send_with_gmail(
                google_access_token=google_access_token,
                google_refresh_token=google_refresh_token,
                google_email=google_email,
                client_email=client_email,
                subject=subject,
                html_body=html,
            )
            
            if success:
                return True
            else:
                logger.warning(f"Falló envío con Gmail, usando Resend como fallback")
        
        # Fallback a Resend
        if not ResendService.is_configured():
            logger.warning("Resend no está configurado. Email de cancelación no enviado.")
            return False

        try:
            from datetime import datetime
            booking_date = datetime.fromisoformat(starts_at)
            date_str = booking_date.strftime("%d/%m/%Y")
            time_str = booking_date.strftime("%H:%M")

            subject = f"❌ Tu reserva en {business_name} fue cancelada"
            html = _get_cancellation_html(
                client_name, business_name, service_name, professional_name,
                date_str, time_str, cancellation_reason
            )

            email_data = {
                "from": settings.email_from,
                "to": client_email,
                "subject": subject,
                "html": html,
            }

            response = resend.Emails.send(email_data)

            if response.get("id"):
                logger.info(f"Email de cancelación enviado a {client_email} (ID: {response['id']})")
                return True
            else:
                logger.error(f"Error enviando email de cancelación a {client_email}: {response}")
                return False

        except Exception as e:
            logger.error(f"Excepción al enviar email de cancelación: {e}")
            return False


def _get_confirmation_html(client_name, business_name, service_name, professional_name, date_str, time_str, confirmation_link):
    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #000; margin: 0;">¡Reserva Confirmada! ✅</h1>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 16px;">Hola <strong>{client_name}</strong>,</p>
            <p style="margin: 10px 0 0 0; color: #666;">Tu reserva en <strong>{business_name}</strong> está confirmada.</p>
        </div>

        <div style="background: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles de tu reserva:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; color: #666;">Servicio:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600;">{service_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; color: #666;">Profesional:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600;">{professional_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; color: #666;">Fecha:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600;">{date_str}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #666;">Hora:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600;">{time_str}</td>
                </tr>
            </table>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
            <a href="{confirmation_link}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                Ver detalles de tu reserva
            </a>
        </div>

        <div style="background: #f0f7ff; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #004085;">
                <strong>💡 Tip:</strong> Guarda este email. Lo necesitarás para cancelar o reprogramar tu reserva.
            </p>
        </div>

        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 0;">Mensaje automático de {business_name}</p>
            <p style="margin: 5px 0 0 0;">No responda este email. Si tiene preguntas, contáctenos directamente.</p>
        </div>
    </div>
    """


def _get_cancellation_html(client_name, business_name, service_name, professional_name, date_str, time_str, cancellation_reason):
    reason_html = ""
    if cancellation_reason:
        reason_html = f'<div style="background: #fafafa; padding: 15px; border-radius: 4px; margin-bottom: 20px;"><p style="margin: 0; font-size: 14px; color: #666;"><strong>Motivo:</strong> {cancellation_reason}</p></div>'

    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d32f2f; margin: 0;">Reserva Cancelada ❌</h1>
        </div>

        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 16px;">Hola <strong>{client_name}</strong>,</p>
            <p style="margin: 10px 0 0 0; color: #666;">Tu reserva en <strong>{business_name}</strong> ha sido cancelada.</p>
        </div>

        <div style="background: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles de la reserva cancelada:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; color: #666;">Servicio:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600;">{service_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; color: #666;">Profesional:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600;">{professional_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; color: #666;">Fecha:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600;">{date_str}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #666;">Hora:</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 600;">{time_str}</td>
                </tr>
            </table>
        </div>

        {reason_html}

        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 0;">Mensaje automático de {business_name}</p>
            <p style="margin: 5px 0 0 0;">Si desea reprogramar su reserva, contáctenos directamente.</p>
        </div>
    </div>
    """


resend_service = ResendService()
