"""
Controller para reservas (bookings).
Orquesta validación de disponibilidad, creación y gestión de reservas.
"""
from repositories.booking_repo import booking_repo
from repositories.professional_repo import professional_repo
from repositories.business_repo import business_repo
from repositories.schedule_blocks_repo import schedule_blocks_repo
from repositories.availability_repo import availability_repo
from services.auth_service import auth_service
from utils.errors import AppError
from utils.logger import get_logger
from typing import Dict, Any, List, Optional
from datetime import datetime
import secrets

logger = get_logger("booking_controller")


class BookingController:
    """Controlador de reservas."""

    def _verify_business_ownership(self, token: str, business_id: str) -> str:
        """
        Verificar que el usuario sea owner del negocio.
        Devuelve el user_id.
        """
        payload = auth_service.verify_token(token)
        user_id = payload["sub"]

        business = business_repo.find_by_id(business_id)
        if not business or business["owner_id"] != user_id:
            raise AppError(
                message="No tenés permiso para este negocio",
                code="FORBIDDEN",
                status_code=403,
            )

        return user_id

    def create_booking(
        self,
        token: str,
        business_id: str,
        professional_id: str,
        service_id: str,
        branch_id: Optional[str],
        client_name: str,
        client_email: str,
        client_phone: Optional[str],
        client_notes: Optional[str],
        starts_at: str,
        ends_at: str,
        payment_required: bool = False,
        payment_amount: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Crear una reserva con validación de disponibilidad."""
        self._verify_business_ownership(token, business_id)

        # Validar que el profesional exista y pertenezca al negocio
        prof = professional_repo.find_by_id(professional_id)
        if not prof or prof["business_id"] != business_id:
            raise AppError(
                message="Profesional no encontrado",
                code="NOT_FOUND",
                status_code=404,
            )

        # Validar que no hay conflictos de horario
        conflicts = booking_repo.find_conflicts(professional_id, starts_at, ends_at)
        if conflicts:
            raise AppError(
                message="El profesional no está disponible en ese horario",
                code="UNAVAILABLE",
                status_code=409,
            )

        # Validar que no hay bloqueos en ese período
        blocks = schedule_blocks_repo.find_overlapping(
            professional_id, starts_at, ends_at
        )
        if blocks:
            raise AppError(
                message="El profesional tiene un bloqueo en ese período",
                code="BLOCKED",
                status_code=409,
            )

        # Generar token único de confirmación
        confirmation_token = secrets.token_urlsafe(32)

        logger.info(
            f"Creating booking for {client_name} ({client_email}) with professional {professional_id}"
        )

        return booking_repo.create(
            business_id=business_id,
            branch_id=branch_id,
            professional_id=professional_id,
            service_id=service_id,
            client_name=client_name,
            client_email=client_email,
            client_phone=client_phone,
            client_notes=client_notes,
            starts_at=starts_at,
            ends_at=ends_at,
            confirmation_token=confirmation_token,
            payment_required=payment_required,
            payment_amount=payment_amount,
        )

    def list_bookings(
        self,
        token: str,
        business_id: str,
        status: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Listar reservas de un negocio."""
        self._verify_business_ownership(token, business_id)

        bookings = booking_repo.find_by_business_id(
            business_id=business_id,
            status=status,
            start_date=start_date,
            end_date=end_date,
        )
        return {"bookings": bookings, "count": len(bookings)}

    def get_booking(self, token: str, booking_id: str) -> Dict[str, Any]:
        """Obtener detalles de una reserva (verificar ownership)."""
        booking = booking_repo.find_by_id(booking_id)
        if not booking:
            raise AppError(
                message="Reserva no encontrada",
                code="NOT_FOUND",
                status_code=404,
            )

        self._verify_business_ownership(token, booking["business_id"])
        return booking

    def update_booking(
        self,
        token: str,
        booking_id: str,
        client_name: Optional[str] = None,
        client_email: Optional[str] = None,
        client_phone: Optional[str] = None,
        client_notes: Optional[str] = None,
        starts_at: Optional[str] = None,
        ends_at: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Actualizar datos de una reserva."""
        booking = booking_repo.find_by_id(booking_id)
        if not booking:
            raise AppError(
                message="Reserva no encontrada",
                code="NOT_FOUND",
                status_code=404,
            )

        self._verify_business_ownership(token, booking["business_id"])

        # Si se actualiza horario, validar disponibilidad
        if starts_at or ends_at:
            new_starts_at = starts_at or booking["starts_at"]
            new_ends_at = ends_at or booking["ends_at"]

            conflicts = booking_repo.find_conflicts(
                booking["professional_id"], new_starts_at, new_ends_at
            )
            # Excluir la reserva actual del conflicto
            conflicts = [c for c in conflicts if c["id"] != booking_id]
            if conflicts:
                raise AppError(
                    message="No hay disponibilidad en ese horario",
                    code="UNAVAILABLE",
                    status_code=409,
                )

        logger.info(f"Updating booking {booking_id}")

        return booking_repo.update(
            booking_id=booking_id,
            client_name=client_name,
            client_email=client_email,
            client_phone=client_phone,
            client_notes=client_notes,
            starts_at=starts_at,
            ends_at=ends_at,
        )

    def cancel_booking(
        self,
        token: str,
        booking_id: str,
        cancellation_reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Cancelar una reserva (como admin/owner)."""
        booking = booking_repo.find_by_id(booking_id)
        if not booking:
            raise AppError(
                message="Reserva no encontrada",
                code="NOT_FOUND",
                status_code=404,
            )

        user_id = self._verify_business_ownership(token, booking["business_id"])

        logger.info(f"Cancelling booking {booking_id} by admin {user_id}")

        return booking_repo.cancel(
            booking_id=booking_id,
            cancelled_by="admin",
            cancellation_reason=cancellation_reason,
        )

    def get_booking_by_token(self, confirmation_token: str) -> Dict[str, Any]:
        """Obtener reserva usando token de confirmación (sin autenticación)."""
        booking = booking_repo.find_by_confirmation_token(confirmation_token)
        if not booking:
            raise AppError(
                message="Token inválido o expirado",
                code="INVALID_TOKEN",
                status_code=404,
            )
        return booking

    def cancel_booking_by_token(
        self,
        confirmation_token: str,
        cancellation_reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Cancelar una reserva usando token (cliente final)."""
        booking = booking_repo.find_by_confirmation_token(confirmation_token)
        if not booking:
            raise AppError(
                message="Token inválido o expirado",
                code="INVALID_TOKEN",
                status_code=404,
            )

        if booking["status"] == "cancelled":
            raise AppError(
                message="Esta reserva ya fue cancelada",
                code="ALREADY_CANCELLED",
                status_code=409,
            )

        logger.info(f"Cancelling booking {booking['id']} by client via token")

        return booking_repo.cancel(
            booking_id=booking["id"],
            cancelled_by="client",
            cancellation_reason=cancellation_reason,
        )


booking_controller = BookingController()
