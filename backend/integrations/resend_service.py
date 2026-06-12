"""
Servicio de email transaccional usando Resend.
Maneja envío de confirmaciones y cancelaciones de reservas.
"""
from typing import Optional
from resend import Resend
from config.settings import settings
from utils.logger import get_logger

logger = get_logger("resend_service")

# Cliente de Resend si está configurado
resend_client = Resend(api_key=settings.resend_api_key) if settings.resend_api_key else None


class ResendService:
    """Servicio de email usando Resend."""

    @staticmethod
    def is_configured() -> bool:
        """Verifica si Resend está configurado."""
        return settings.resend_api_key is not None

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
    ) -> bool:
        """
        Envía email de confirmación de reserva.

        Retorna True si se envió exitosamente, False si no está configurado.
        """
        if not ResendService.is_configured():
            logger.warning("Resend no está configurado. Email de confirmación no enviado.")
            return False

        try:
            from datetime import datetime
            booking_date = datetime.fromisoformat(starts_at)
            date_str = booking_date.strftime("%d/%m/%Y")
            time_str = booking_date.strftime("%H:%M")

            subject = f"✅ Tu reserva en {business_name} está confirmada"
            html = f"""
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

            email_data = {
                "from": settings.email_from,
                "to": client_email,
                "subject": subject,
                "html": html,
            }

            response = resend_client.emails.send(email_data)

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
    ) -> bool:
        """
        Envía email de cancelación de reserva.

        Retorna True si se envió exitosamente, False si no está configurado.
        """
        if not ResendService.is_configured():
            logger.warning("Resend no está configurado. Email de cancelación no enviado.")
            return False

        try:
            from datetime import datetime
            booking_date = datetime.fromisoformat(starts_at)
            date_str = booking_date.strftime("%d/%m/%Y")
            time_str = booking_date.strftime("%H:%M")

            subject = f"❌ Tu reserva en {business_name} fue cancelada"
            html = f"""
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

                {f'<div style="background: #fafafa; padding: 15px; border-radius: 4px; margin-bottom: 20px;"><p style="margin: 0; font-size: 14px; color: #666;"><strong>Motivo:</strong> {cancellation_reason}</p></div>' if cancellation_reason else ''}

                <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p style="margin: 0;">Mensaje automático de {business_name}</p>
                    <p style="margin: 5px 0 0 0;">Si desea reprogramar su reserva, contáctenos directamente.</p>
                </div>
            </div>
            """

            email_data = {
                "from": settings.email_from,
                "to": client_email,
                "subject": subject,
                "html": html,
            }

            response = resend_client.emails.send(email_data)

            if response.get("id"):
                logger.info(f"Email de cancelación enviado a {client_email} (ID: {response['id']})")
                return True
            else:
                logger.error(f"Error enviando email de cancelación a {client_email}: {response}")
                return False

        except Exception as e:
            logger.error(f"Excepción al enviar email de cancelación: {e}")
            return False


resend_service = ResendService()
