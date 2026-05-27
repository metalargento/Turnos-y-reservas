"""
Repository para disponibilidad semanal (availability) de profesionales.
Disponibilidad regular: horarios fijos por día de la semana.
"""
from utils.db import db
from utils.errors import AppError
from utils.logger import get_logger
from typing import List, Optional, Dict, Any

logger = get_logger("availability_repo")


class AvailabilityRepository:
    """Repositorio de disponibilidad semanal."""

    def create(
        self,
        professional_id: str,
        day_of_week: int,
        start_time: str,
        end_time: str,
    ) -> Dict[str, Any]:
        """
        Crear un horario de disponibilidad semanal.
        day_of_week: 0=Domingo, 1=Lunes... 6=Sábado
        """
        if not (0 <= day_of_week <= 6):
            raise AppError(
                message="day_of_week debe estar entre 0 y 6",
                code="INVALID_DAY",
                status_code=400,
            )

        query = """
            INSERT INTO availability
            (professional_id, day_of_week, start_time, end_time, is_active)
            VALUES (%s, %s, %s::TIME, %s::TIME, TRUE)
            RETURNING id, professional_id, day_of_week, start_time, end_time,
                      is_active, created_at
        """
        result = db.execute_one(query, (professional_id, day_of_week, start_time, end_time))
        if not result:
            raise AppError(
                message="Error al crear disponibilidad",
                code="DB_ERROR",
                status_code=500,
            )
        return {
            "id": str(result["id"]),
            "professional_id": str(result["professional_id"]),
            "day_of_week": result["day_of_week"],
            "start_time": str(result["start_time"]),
            "end_time": str(result["end_time"]),
            "is_active": result["is_active"],
            "created_at": result["created_at"].isoformat() if result["created_at"] else None,
        }

    def find_by_professional_id(self, professional_id: str) -> List[Dict[str, Any]]:
        """Obtener todos los horarios de disponibilidad de un profesional."""
        query = """
            SELECT id, professional_id, day_of_week, start_time, end_time,
                   is_active, created_at
            FROM availability
            WHERE professional_id = %s AND is_active = TRUE
            ORDER BY day_of_week, start_time
        """
        results = db.execute_query(query, (professional_id,))
        return [
            {
                "id": str(row["id"]),
                "professional_id": str(row["professional_id"]),
                "day_of_week": row["day_of_week"],
                "start_time": str(row["start_time"]),
                "end_time": str(row["end_time"]),
                "is_active": row["is_active"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            }
            for row in results
        ] if results else []

    def find_by_id(self, availability_id: str) -> Optional[Dict[str, Any]]:
        """Obtener un horario de disponibilidad por ID."""
        query = """
            SELECT id, professional_id, day_of_week, start_time, end_time,
                   is_active, created_at
            FROM availability
            WHERE id = %s
        """
        result = db.execute_one(query, (availability_id,))
        if not result:
            return None
        return {
            "id": str(result["id"]),
            "professional_id": str(result["professional_id"]),
            "day_of_week": result["day_of_week"],
            "start_time": str(result["start_time"]),
            "end_time": str(result["end_time"]),
            "is_active": result["is_active"],
            "created_at": result["created_at"].isoformat() if result["created_at"] else None,
        }

    def update(
        self,
        availability_id: str,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Actualizar horarios de disponibilidad."""
        updates = []
        params = []

        if start_time is not None:
            updates.append("start_time = %s::TIME")
            params.append(start_time)
        if end_time is not None:
            updates.append("end_time = %s::TIME")
            params.append(end_time)

        if not updates:
            result = self.find_by_id(availability_id)
            if not result:
                raise AppError(
                    message="Disponibilidad no encontrada",
                    code="NOT_FOUND",
                    status_code=404,
                )
            return result

        params.append(availability_id)
        query = f"""
            UPDATE availability
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING id, professional_id, day_of_week, start_time, end_time,
                      is_active, created_at
        """

        result = db.execute_one(query, params)
        if not result:
            raise AppError(
                message="Disponibilidad no encontrada",
                code="NOT_FOUND",
                status_code=404,
            )
        return {
            "id": str(result["id"]),
            "professional_id": str(result["professional_id"]),
            "day_of_week": result["day_of_week"],
            "start_time": str(result["start_time"]),
            "end_time": str(result["end_time"]),
            "is_active": result["is_active"],
            "created_at": result["created_at"].isoformat() if result["created_at"] else None,
        }

    def deactivate(self, availability_id: str) -> None:
        """Desactivar (soft delete) un horario de disponibilidad."""
        query = """
            UPDATE availability
            SET is_active = FALSE
            WHERE id = %s
        """
        db.execute_query(query, (availability_id,), fetch=False)


availability_repo = AvailabilityRepository()
