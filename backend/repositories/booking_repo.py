"""
Repository para reservas (bookings) de clientes.
"""
from utils.db import db
from utils.errors import AppError
from utils.logger import get_logger
from typing import List, Optional, Dict, Any
from datetime import datetime

logger = get_logger("booking_repo")


class BookingRepository:
    """Repositorio de reservas."""

    def create(
        self,
        business_id: str,
        branch_id: Optional[str],
        professional_id: Optional[str],
        service_id: Optional[str],
        client_name: str,
        client_email: str,
        client_phone: Optional[str],
        client_notes: Optional[str],
        starts_at: str,
        ends_at: str,
        confirmation_token: str,
        payment_required: bool = False,
        payment_amount: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Crear una reserva."""
        query = """
            INSERT INTO bookings
            (business_id, branch_id, professional_id, service_id,
             client_name, client_email, client_phone, client_notes,
             starts_at, ends_at, confirmation_token,
             payment_required, payment_amount, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s,
                    %s::TIMESTAMPTZ, %s::TIMESTAMPTZ, %s,
                    %s, %s, 'confirmed')
            RETURNING id, business_id, branch_id, professional_id, service_id,
                      client_name, client_email, client_phone, client_notes,
                      starts_at, ends_at, status, payment_required, payment_amount,
                      payment_status, confirmation_token, created_at, updated_at
        """
        result = db.execute_one(
            query,
            (
                business_id,
                branch_id,
                professional_id,
                service_id,
                client_name,
                client_email,
                client_phone,
                client_notes,
                starts_at,
                ends_at,
                confirmation_token,
                payment_required,
                payment_amount,
            ),
        )
        if not result:
            raise AppError(
                message="Error al crear reserva",
                code="DB_ERROR",
                status_code=500,
            )
        return self._format_booking(result)

    def find_by_id(self, booking_id: str) -> Optional[Dict[str, Any]]:
        """Obtener una reserva por ID."""
        query = """
            SELECT id, business_id, branch_id, professional_id, service_id,
                   client_name, client_email, client_phone, client_notes,
                   starts_at, ends_at, status, cancelled_by, cancellation_reason,
                   payment_required, payment_status, payment_amount, payment_id,
                   confirmation_token, created_at, updated_at
            FROM bookings
            WHERE id = %s
        """
        result = db.execute_one(query, (booking_id,))
        return self._format_booking(result) if result else None

    def find_by_confirmation_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Obtener una reserva por token de confirmación."""
        query = """
            SELECT id, business_id, branch_id, professional_id, service_id,
                   client_name, client_email, client_phone, client_notes,
                   starts_at, ends_at, status, cancelled_by, cancellation_reason,
                   payment_required, payment_status, payment_amount, payment_id,
                   confirmation_token, created_at, updated_at
            FROM bookings
            WHERE confirmation_token = %s
        """
        result = db.execute_one(query, (token,))
        return self._format_booking(result) if result else None

    def find_by_business_id(
        self,
        business_id: str,
        status: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Obtener reservas de un negocio, opcionalmente filtradas por estado y rango de fechas."""
        query = """
            SELECT id, business_id, branch_id, professional_id, service_id,
                   client_name, client_email, client_phone, client_notes,
                   starts_at, ends_at, status, cancelled_by, cancellation_reason,
                   payment_required, payment_status, payment_amount, payment_id,
                   confirmation_token, created_at, updated_at
            FROM bookings
            WHERE business_id = %s
        """
        params = [business_id]

        if status:
            query += " AND status = %s"
            params.append(status)

        if start_date:
            query += " AND starts_at >= %s::TIMESTAMPTZ"
            params.append(start_date)

        if end_date:
            query += " AND ends_at <= %s::TIMESTAMPTZ"
            params.append(end_date)

        query += " ORDER BY starts_at DESC"

        results = db.execute_query(query, tuple(params))
        return [self._format_booking(row) for row in results] if results else []

    def find_conflicts(
        self,
        professional_id: str,
        starts_at: str,
        ends_at: str,
    ) -> List[Dict[str, Any]]:
        """
        Encontrar conflictos de horario con otras reservas confirmadas.
        Útil para validar disponibilidad antes de crear una reserva.
        """
        query = """
            SELECT id, business_id, branch_id, professional_id, service_id,
                   client_name, client_email, client_phone, client_notes,
                   starts_at, ends_at, status, cancelled_by, cancellation_reason,
                   payment_required, payment_status, payment_amount, payment_id,
                   confirmation_token, created_at, updated_at
            FROM bookings
            WHERE professional_id = %s
              AND status IN ('confirmed', 'rescheduled')
              AND starts_at::TIMESTAMPTZ < %s::TIMESTAMPTZ
              AND ends_at::TIMESTAMPTZ > %s::TIMESTAMPTZ
        """
        results = db.execute_query(query, (professional_id, ends_at, starts_at))
        return [self._format_booking(row) for row in results] if results else []

    def update(
        self,
        booking_id: str,
        client_name: Optional[str] = None,
        client_email: Optional[str] = None,
        client_phone: Optional[str] = None,
        client_notes: Optional[str] = None,
        starts_at: Optional[str] = None,
        ends_at: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Actualizar una reserva."""
        updates = []
        params = []

        if client_name is not None:
            updates.append("client_name = %s")
            params.append(client_name)
        if client_email is not None:
            updates.append("client_email = %s")
            params.append(client_email)
        if client_phone is not None:
            updates.append("client_phone = %s")
            params.append(client_phone)
        if client_notes is not None:
            updates.append("client_notes = %s")
            params.append(client_notes)
        if starts_at is not None:
            updates.append("starts_at = %s::TIMESTAMPTZ")
            params.append(starts_at)
        if ends_at is not None:
            updates.append("ends_at = %s::TIMESTAMPTZ")
            params.append(ends_at)
        if status is not None:
            updates.append("status = %s")
            params.append(status)

        if not updates:
            result = self.find_by_id(booking_id)
            if not result:
                raise AppError(
                    message="Reserva no encontrada",
                    code="NOT_FOUND",
                    status_code=404,
                )
            return result

        params.append(booking_id)
        query = f"""
            UPDATE bookings
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING id, business_id, branch_id, professional_id, service_id,
                      client_name, client_email, client_phone, client_notes,
                      starts_at, ends_at, status, cancelled_by, cancellation_reason,
                      payment_required, payment_status, payment_amount, payment_id,
                      confirmation_token, created_at, updated_at
        """

        result = db.execute_one(query, tuple(params))
        if not result:
            raise AppError(
                message="Reserva no encontrada",
                code="NOT_FOUND",
                status_code=404,
            )
        return self._format_booking(result)

    def cancel(
        self,
        booking_id: str,
        cancelled_by: str,
        cancellation_reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Cancelar una reserva."""
        query = """
            UPDATE bookings
            SET status = 'cancelled', cancelled_by = %s, cancellation_reason = %s
            WHERE id = %s
            RETURNING id, business_id, branch_id, professional_id, service_id,
                      client_name, client_email, client_phone, client_notes,
                      starts_at, ends_at, status, cancelled_by, cancellation_reason,
                      payment_required, payment_status, payment_amount, payment_id,
                      confirmation_token, created_at, updated_at
        """
        result = db.execute_one(query, (cancelled_by, cancellation_reason, booking_id))
        if not result:
            raise AppError(
                message="Reserva no encontrada",
                code="NOT_FOUND",
                status_code=404,
            )
        return self._format_booking(result)

    def _format_booking(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Formatear una reserva para devolver como respuesta."""
        return {
            "id": str(row["id"]),
            "business_id": str(row["business_id"]),
            "branch_id": str(row["branch_id"]) if row["branch_id"] else None,
            "professional_id": str(row["professional_id"]) if row["professional_id"] else None,
            "service_id": str(row["service_id"]) if row["service_id"] else None,
            "client_name": row["client_name"],
            "client_email": row["client_email"],
            "client_phone": row["client_phone"],
            "client_notes": row["client_notes"],
            "starts_at": row["starts_at"].isoformat() if row["starts_at"] else None,
            "ends_at": row["ends_at"].isoformat() if row["ends_at"] else None,
            "status": row["status"],
            "cancelled_by": row.get("cancelled_by"),
            "cancellation_reason": row.get("cancellation_reason"),
            "payment_required": row["payment_required"],
            "payment_status": row["payment_status"],
            "payment_amount": float(row["payment_amount"]) if row["payment_amount"] else None,
            "payment_id": row.get("payment_id"),
            "confirmation_token": row["confirmation_token"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
        }


booking_repo = BookingRepository()
