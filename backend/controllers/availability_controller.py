"""
Controller para disponibilidad y bloqueos de agenda.
Orquesta la lógica entre repositories, servicios y validaciones.
"""
from repositories.availability_repo import availability_repo
from repositories.schedule_blocks_repo import schedule_blocks_repo
from repositories.professional_repo import professional_repo
from repositories.business_repo import business_repo
from services.auth_service import auth_service
from utils.errors import AppError
from utils.logger import get_logger
from typing import Dict, Any, List

logger = get_logger("availability_controller")


class AvailabilityController:
    """Controlador de disponibilidad y bloqueos."""

    def _verify_professional_ownership(self, token: str, professional_id: str) -> str:
        """
        Verificar que el usuario tenga permiso sobre el profesional.
        Devuelve el business_id del profesional.
        """
        payload = auth_service.verify_token(token)
        owner_id = payload["sub"]

        prof = professional_repo.find_by_id(professional_id)
        if not prof:
            raise AppError(
                message="Profesional no encontrado",
                code="NOT_FOUND",
                status_code=404,
            )

        business = business_repo.find_by_id(prof["business_id"])
        if not business or business["owner_id"] != owner_id:
            raise AppError(
                message="No tenés permiso para este profesional",
                code="FORBIDDEN",
                status_code=403,
            )

        return prof["business_id"]

    # ====== Availability (horarios semanales) ======

    def create_availability(
        self,
        token: str,
        professional_id: str,
        day_of_week: int,
        start_time: str,
        end_time: str,
    ) -> Dict[str, Any]:
        """Crear un horario de disponibilidad semanal."""
        self._verify_professional_ownership(token, professional_id)

        # Validar que start_time < end_time
        if start_time >= end_time:
            raise AppError(
                message="start_time debe ser menor que end_time",
                code="INVALID_TIMES",
                status_code=400,
            )

        logger.info(
            f"Creating availability for professional {professional_id}, "
            f"day {day_of_week}, {start_time}-{end_time}"
        )

        return availability_repo.create(
            professional_id=professional_id,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
        )

    def list_availability(self, token: str, professional_id: str) -> Dict[str, Any]:
        """Listar disponibilidades de un profesional."""
        self._verify_professional_ownership(token, professional_id)

        availabilities = availability_repo.find_by_professional_id(professional_id)
        return {"availabilities": availabilities, "count": len(availabilities)}

    def update_availability(
        self,
        token: str,
        availability_id: str,
        start_time: str = None,
        end_time: str = None,
    ) -> Dict[str, Any]:
        """Actualizar un horario de disponibilidad."""
        avail = availability_repo.find_by_id(availability_id)
        if not avail:
            raise AppError(
                message="Disponibilidad no encontrada",
                code="NOT_FOUND",
                status_code=404,
            )

        self._verify_professional_ownership(token, avail["professional_id"])

        logger.info(f"Updating availability {availability_id}")

        return availability_repo.update(
            availability_id=availability_id,
            start_time=start_time,
            end_time=end_time,
        )

    def delete_availability(self, token: str, availability_id: str) -> None:
        """Desactivar un horario de disponibilidad."""
        avail = availability_repo.find_by_id(availability_id)
        if not avail:
            raise AppError(
                message="Disponibilidad no encontrada",
                code="NOT_FOUND",
                status_code=404,
            )

        self._verify_professional_ownership(token, avail["professional_id"])

        logger.info(f"Deactivating availability {availability_id}")

        availability_repo.deactivate(availability_id)

    # ====== Schedule Blocks (bloqueos manuales) ======

    def create_schedule_block(
        self,
        token: str,
        professional_id: str,
        blocked_from: str,
        blocked_until: str,
        reason: str = None,
    ) -> Dict[str, Any]:
        """Crear un bloqueo de agenda (vacaciones, feriado, etc)."""
        self._verify_professional_ownership(token, professional_id)

        # Validar que blocked_from < blocked_until
        if blocked_from >= blocked_until:
            raise AppError(
                message="blocked_from debe ser menor que blocked_until",
                code="INVALID_DATES",
                status_code=400,
            )

        payload = auth_service.verify_token(token)
        created_by = payload["sub"]

        logger.info(
            f"Creating schedule block for professional {professional_id}, "
            f"from {blocked_from} to {blocked_until}, reason: {reason}"
        )

        return schedule_blocks_repo.create(
            professional_id=professional_id,
            blocked_from=blocked_from,
            blocked_until=blocked_until,
            reason=reason,
            created_by=created_by,
        )

    def list_schedule_blocks(
        self, token: str, professional_id: str
    ) -> Dict[str, Any]:
        """Listar bloqueos de agenda de un profesional."""
        self._verify_professional_ownership(token, professional_id)

        blocks = schedule_blocks_repo.find_by_professional_id(professional_id)
        return {"blocks": blocks, "count": len(blocks)}

    def delete_schedule_block(self, token: str, block_id: str) -> None:
        """Eliminar un bloqueo de agenda."""
        block = schedule_blocks_repo.find_by_id(block_id)
        if not block:
            raise AppError(
                message="Bloqueo no encontrado",
                code="NOT_FOUND",
                status_code=404,
            )

        self._verify_professional_ownership(token, block["professional_id"])

        logger.info(f"Deleting schedule block {block_id}")

        schedule_blocks_repo.delete(block_id)


availability_controller = AvailabilityController()
