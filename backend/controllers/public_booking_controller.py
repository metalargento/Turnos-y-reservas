"""
Controlador público para reservas (sin autenticación).
Maneja el flujo de reserva para clientes finales.
"""
import secrets
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from zoneinfo import ZoneInfo

from repositories.business_repo import business_repo
from repositories.professional_repo import professional_repo
from repositories.service_repo import service_repo
from repositories.booking_repo import booking_repo
from repositories.availability_repo import availability_repo
from repositories.schedule_blocks_repo import schedule_blocks_repo
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("public_booking_controller")

# Zona horaria Argentina (UTC-3)
TZ_AR = ZoneInfo("America/Argentina/Buenos_Aires")


class PublicBookingController:
    """Controlador de reservas públicas."""

    def get_business_info(self, slug: str) -> Dict[str, Any]:
        """
        Obtener información del negocio con profesionales y sus servicios.
        Entrada principal al widget.
        """
        business = business_repo.find_by_slug(slug)
        if not business or business.get("plan_status") != "active":
            raise AppError(
                message="El negocio no existe o no está disponible",
                code="BUSINESS_NOT_FOUND",
                status_code=404,
            )

        # Traer profesionales activos del negocio
        professionals = professional_repo.find_by_business_id(business["id"])
        active_professionals = [p for p in professionals if p.get("is_active")]

        # Para cada profesional, traer sus servicios
        professionals_with_services = []
        for prof in active_professionals:
            services = professional_repo.get_services(prof["id"])
            active_services = [s for s in services if s.get("is_active")]
            professionals_with_services.append({
                "id": prof["id"],
                "display_name": prof["display_name"],
                "avatar_url": prof.get("avatar_url"),
                "bio": prof.get("bio"),
                "services": active_services,
            })

        return {
            "business": {
                "id": business["id"],
                "name": business["name"],
                "slug": business["slug"],
                "rubro": business.get("rubro"),
                "description": business.get("description"),
                "logo_url": business.get("logo_url"),
                "primary_color": business.get("primary_color", "#000000"),
                "min_advance_hours": business.get("min_advance_hours", 0),
            },
            "professionals": professionals_with_services,
        }

    def get_available_days(
        self,
        slug: str,
        professional_id: str,
        service_id: str,
        year: int,
        month: int,
    ) -> Dict[str, Any]:
        """
        Obtener días del mes que tienen al menos un slot disponible.
        Retorna lista de días (1-31) que el cliente puede seleccionar.
        """
        business = business_repo.find_by_slug(slug)
        if not business:
            raise AppError(
                message="El negocio no existe",
                code="BUSINESS_NOT_FOUND",
                status_code=404,
            )

        service = service_repo.find_by_id(service_id)
        if not service:
            raise AppError(
                message="El servicio no existe",
                code="SERVICE_NOT_FOUND",
                status_code=404,
            )

        # Obtener disponibilidades semanales del profesional
        availabilities = availability_repo.find_by_professional_id(professional_id)
        working_days = {a["day_of_week"] for a in availabilities}

        # Rango del mes: día 1 a último día
        if month == 12:
            last_day = 31
            next_month_start = datetime(year + 1, 1, 1, tzinfo=TZ_AR)
        else:
            # Último día del mes actual
            next_month_start = datetime(year, month + 1, 1, tzinfo=TZ_AR)
            last_day = (next_month_start - timedelta(days=1)).day

        month_start = datetime(year, month, 1, tzinfo=TZ_AR)
        month_end = next_month_start

        # Traer bloques y reservas del mes en 2 queries
        blocks = schedule_blocks_repo.find_overlapping(
            professional_id,
            month_start.isoformat(),
            month_end.isoformat(),
        )
        bookings = booking_repo.find_conflicts(
            professional_id,
            month_start.isoformat(),
            month_end.isoformat(),
        )

        available_days = []
        now = datetime.now(tz=TZ_AR)
        min_advance_hours = business.get("min_advance_hours", 0)

        for day in range(1, last_day + 1):
            date = datetime(year, month, day, tzinfo=TZ_AR)

            # Ignorar días pasados (con margen de min_advance_hours)
            if date + timedelta(hours=24) < now + timedelta(hours=min_advance_hours):
                continue

            # Mapeo: Python weekday (0=Lunes) → DB day_of_week (0=Domingo)
            python_weekday = date.weekday()
            db_day_of_week = (python_weekday + 1) % 7

            # Ignorar si profesional no trabaja ese día
            if db_day_of_week not in working_days:
                continue

            # Verificar si tiene al menos 1 slot disponible ese día
            slots = self._compute_slots_for_date(
                professional_id,
                date,
                availabilities,
                service["duration_minutes"],
                blocks,
                bookings,
            )

            if any(s["status"] == "available" for s in slots):
                available_days.append(day)

        return {
            "year": year,
            "month": month,
            "available_days": available_days,
        }

    def get_slots_for_date(
        self,
        slug: str,
        professional_id: str,
        service_id: str,
        date_str: str,
    ) -> Dict[str, Any]:
        """
        Obtener slots de horario para un día específico (YYYY-MM-DD).
        Devuelve lista de chips con status: available, taken, blocked, past.
        """
        business = business_repo.find_by_slug(slug)
        if not business:
            raise AppError(
                message="El negocio no existe",
                code="BUSINESS_NOT_FOUND",
                status_code=404,
            )

        service = service_repo.find_by_id(service_id)
        if not service:
            raise AppError(
                message="El servicio no existe",
                code="SERVICE_NOT_FOUND",
                status_code=404,
            )

        # Parsear fecha
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=TZ_AR)
        except ValueError:
            raise AppError(
                message="Formato de fecha inválido (YYYY-MM-DD)",
                code="INVALID_DATE",
                status_code=400,
            )

        # Obtener disponibilidades del profesional
        availabilities = availability_repo.find_by_professional_id(professional_id)

        # Traer bloques y reservas del día
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        blocks = schedule_blocks_repo.find_overlapping(
            professional_id,
            day_start.isoformat(),
            day_end.isoformat(),
        )
        bookings = booking_repo.find_conflicts(
            professional_id,
            day_start.isoformat(),
            day_end.isoformat(),
        )

        slots = self._compute_slots_for_date(
            professional_id,
            date,
            availabilities,
            service["duration_minutes"],
            blocks,
            bookings,
        )

        return {
            "date": date_str,
            "duration_minutes": service["duration_minutes"],
            "slots": slots,
        }

    def create_public_booking(
        self,
        slug: str,
        professional_id: str,
        service_id: str,
        branch_id: Optional[str],
        starts_at: str,
        ends_at: str,
        client_name: str,
        client_email: str,
        client_phone: Optional[str],
        client_notes: Optional[str],
    ) -> Dict[str, Any]:
        """
        Crear una reserva pública sin autenticación.
        Valida anticipación mínima, conflictos de horario y bloqueos.
        """
        business = business_repo.find_by_slug(slug)
        if not business:
            raise AppError(
                message="El negocio no existe",
                code="BUSINESS_NOT_FOUND",
                status_code=404,
            )

        professional = professional_repo.find_by_id(professional_id)
        if not professional or professional["business_id"] != business["id"]:
            raise AppError(
                message="El profesional no existe o no pertenece al negocio",
                code="PROFESSIONAL_NOT_FOUND",
                status_code=404,
            )

        service = service_repo.find_by_id(service_id)
        if not service:
            raise AppError(
                message="El servicio no existe",
                code="SERVICE_NOT_FOUND",
                status_code=404,
            )

        # Validar anticipación mínima
        try:
            starts_dt = datetime.fromisoformat(starts_at)
        except (ValueError, TypeError):
            raise AppError(
                message="Formato de fecha inválido",
                code="INVALID_DATE",
                status_code=400,
            )

        now = datetime.now(tz=TZ_AR)
        min_advance = timedelta(hours=business.get("min_advance_hours", 0))

        if starts_dt < now + min_advance:
            raise AppError(
                message=f"La reserva debe ser con al menos {business.get('min_advance_hours', 0)} hora(s) de anticipación",
                code="INSUFFICIENT_ADVANCE",
                status_code=400,
            )

        # Validar conflictos
        conflicts = booking_repo.find_conflicts(professional_id, starts_at, ends_at)
        if conflicts:
            raise AppError(
                message="Este horario ya está ocupado",
                code="SLOT_TAKEN",
                status_code=409,
            )

        # Validar bloqueos
        overlapping_blocks = schedule_blocks_repo.find_overlapping(
            professional_id, starts_at, ends_at
        )
        if overlapping_blocks:
            raise AppError(
                message="Este horario no está disponible",
                code="SLOT_BLOCKED",
                status_code=400,
            )

        # Crear reserva
        confirmation_token = secrets.token_urlsafe(32)
        booking = booking_repo.create(
            business_id=business["id"],
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
            payment_required=False,
            payment_amount=None,
        )

        return {
            "message": "Tu reserva fue confirmada",
            "booking": booking,
        }

    def _compute_slots_for_date(
        self,
        professional_id: str,
        date: datetime,
        availabilities: List[Dict[str, Any]],
        duration_minutes: int,
        blocks: List[Dict[str, Any]],
        bookings: List[Dict[str, Any]],
    ) -> List[Dict[str, str]]:
        """
        Algoritmo central: genera lista de slots para un día con su status.
        Retorna slots en orden cronológico.
        """
        # Mapeo: Python weekday (0=Lunes) → DB day_of_week (0=Domingo)
        python_weekday = date.weekday()
        db_day_of_week = (python_weekday + 1) % 7

        # Filtrar franjas para ese día de la semana
        day_avails = [a for a in availabilities if a["day_of_week"] == db_day_of_week]

        if not day_avails:
            return []

        all_slots = []
        now = datetime.now(tz=TZ_AR)

        for avail in day_avails:
            # Parsear horarios de disponibilidad (son TIME)
            start_time_str = avail["start_time"]  # "09:00" o "09:00:00"
            end_time_str = avail["end_time"]      # "17:00" o "17:00:00"

            # Parsear con o sin segundos
            for fmt in ["%H:%M:%S", "%H:%M"]:
                try:
                    start_time = datetime.strptime(start_time_str, fmt).time()
                    break
                except ValueError:
                    continue

            for fmt in ["%H:%M:%S", "%H:%M"]:
                try:
                    end_time = datetime.strptime(end_time_str, fmt).time()
                    break
                except ValueError:
                    continue

            slot_start = datetime.combine(
                date.date(),
                start_time,
                tzinfo=TZ_AR,
            )
            avail_end = datetime.combine(
                date.date(),
                end_time,
                tzinfo=TZ_AR,
            )

            # Generar slots de duration_minutes
            while slot_start + timedelta(minutes=duration_minutes) <= avail_end:
                slot_end = slot_start + timedelta(minutes=duration_minutes)

                # Determinar status del slot
                if slot_start < now:
                    status = "past"
                elif self._overlaps_any(slot_start, slot_end, blocks, "blocked_from", "blocked_until"):
                    status = "blocked"
                elif self._overlaps_any(slot_start, slot_end, bookings, "starts_at", "ends_at"):
                    status = "taken"
                else:
                    status = "available"

                all_slots.append({
                    "starts_at": slot_start.isoformat(),
                    "ends_at": slot_end.isoformat(),
                    "status": status,
                })

                slot_start = slot_end

        return all_slots

    def _overlaps_any(
        self,
        slot_start: datetime,
        slot_end: datetime,
        items: List[Dict[str, Any]],
        start_field: str,
        end_field: str,
    ) -> bool:
        """
        Verifica si el slot se superpone con algún item.
        Overlap: item.start < slot_end AND item.end > slot_start
        """
        for item in items:
            item_start = datetime.fromisoformat(item[start_field])
            item_end = datetime.fromisoformat(item[end_field])
            if item_start < slot_end and item_end > slot_start:
                return True
        return False


public_booking_controller = PublicBookingController()
