"""
Repository para bloqueos de agenda (schedule_blocks) de profesionales.
Bloqueos manuales: vacaciones, feriados, ausencias, etc.
"""
from utils.db import db
from utils.errors import AppError
from utils.logger import get_logger
from typing import List, Optional, Dict, Any

logger = get_logger("schedule_blocks_repo")


class ScheduleBlocksRepository:
    """Repositorio de bloqueos de agenda."""

    def create(
        self,
        professional_id: str,
        blocked_from: str,
        blocked_until: str,
        reason: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Crear un bloqueo de agenda.
        blocked_from y blocked_until: timestamps ISO formato
        """
        query = """
            INSERT INTO schedule_blocks
            (professional_id, blocked_from, blocked_until, reason, created_by)
            VALUES (%s, %s::TIMESTAMPTZ, %s::TIMESTAMPTZ, %s, %s)
            RETURNING id, professional_id, blocked_from, blocked_until, reason,
                      created_by, created_at
        """
        result = db.execute_one(
            query, (professional_id, blocked_from, blocked_until, reason, created_by)
        )
        if not result:
            raise AppError(
                message="Error al crear bloqueo",
                code="DB_ERROR",
                status_code=500,
            )
        return {
            "id": str(result["id"]),
            "professional_id": str(result["professional_id"]),
            "blocked_from": result["blocked_from"].isoformat() if result["blocked_from"] else None,
            "blocked_until": result["blocked_until"].isoformat() if result["blocked_until"] else None,
            "reason": result["reason"],
            "created_by": str(result["created_by"]) if result["created_by"] else None,
            "created_at": result["created_at"].isoformat() if result["created_at"] else None,
        }

    def find_by_professional_id(self, professional_id: str) -> List[Dict[str, Any]]:
        """Obtener todos los bloqueos de un profesional."""
        query = """
            SELECT id, professional_id, blocked_from, blocked_until, reason,
                   created_by, created_at
            FROM schedule_blocks
            WHERE professional_id = %s
            ORDER BY blocked_from DESC
        """
        results = db.execute_query(query, (professional_id,))
        return [
            {
                "id": str(row["id"]),
                "professional_id": str(row["professional_id"]),
                "blocked_from": row["blocked_from"].isoformat() if row["blocked_from"] else None,
                "blocked_until": row["blocked_until"].isoformat() if row["blocked_until"] else None,
                "reason": row["reason"],
                "created_by": str(row["created_by"]) if row["created_by"] else None,
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            }
            for row in results
        ] if results else []

    def find_by_id(self, block_id: str) -> Optional[Dict[str, Any]]:
        """Obtener un bloqueo por ID."""
        query = """
            SELECT id, professional_id, blocked_from, blocked_until, reason,
                   created_by, created_at
            FROM schedule_blocks
            WHERE id = %s
        """
        result = db.execute_one(query, (block_id,))
        if not result:
            return None
        return {
            "id": str(result["id"]),
            "professional_id": str(result["professional_id"]),
            "blocked_from": result["blocked_from"].isoformat() if result["blocked_from"] else None,
            "blocked_until": result["blocked_until"].isoformat() if result["blocked_until"] else None,
            "reason": result["reason"],
            "created_by": str(result["created_by"]) if result["created_by"] else None,
            "created_at": result["created_at"].isoformat() if result["created_at"] else None,
        }

    def find_overlapping(
        self,
        professional_id: str,
        blocked_from: str,
        blocked_until: str,
    ) -> List[Dict[str, Any]]:
        """
        Encontrar bloqueos que se solapan con el rango dado.
        Útil para verificar si hay conflictos antes de crear un nuevo bloqueo.
        """
        query = """
            SELECT id, professional_id, blocked_from, blocked_until, reason,
                   created_by, created_at
            FROM schedule_blocks
            WHERE professional_id = %s
              AND blocked_from::TIMESTAMPTZ < %s::TIMESTAMPTZ
              AND blocked_until::TIMESTAMPTZ > %s::TIMESTAMPTZ
        """
        results = db.execute_query(query, (professional_id, blocked_until, blocked_from))
        return [
            {
                "id": str(row["id"]),
                "professional_id": str(row["professional_id"]),
                "blocked_from": row["blocked_from"].isoformat() if row["blocked_from"] else None,
                "blocked_until": row["blocked_until"].isoformat() if row["blocked_until"] else None,
                "reason": row["reason"],
                "created_by": str(row["created_by"]) if row["created_by"] else None,
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            }
            for row in results
        ] if results else []

    def delete(self, block_id: str) -> None:
        """Eliminar un bloqueo (hard delete permitido en bloques)."""
        query = """
            DELETE FROM schedule_blocks
            WHERE id = %s
        """
        db.execute_query(query, (block_id,), fetch=False)


schedule_blocks_repo = ScheduleBlocksRepository()
