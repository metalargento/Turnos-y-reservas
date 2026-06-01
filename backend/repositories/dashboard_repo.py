"""
Repository de dashboard.
Acceso a estadísticas y métricas del negocio.
"""
from typing import Dict, Any, List
from utils.db import db


class DashboardRepository:
    """Repository para estadísticas del dashboard."""

    def get_stats(self, business_id: str) -> Dict[str, Any]:
        """
        Obtiene todas las estadísticas del dashboard de un negocio.

        Args:
            business_id: UUID del negocio

        Returns:
            Diccionario con todas las métricas
        """
        query = """
            SELECT
              COUNT(*) FILTER (
                WHERE DATE(starts_at AT TIME ZONE 'America/Argentina/Buenos_Aires') = CURRENT_DATE
                  AND status IN ('confirmed', 'rescheduled')
              ) AS bookings_today,
              COUNT(*) FILTER (
                WHERE starts_at >= DATE_TRUNC('week', NOW())
                  AND status IN ('confirmed', 'rescheduled')
              ) AS bookings_this_week,
              COUNT(*) FILTER (
                WHERE starts_at >= DATE_TRUNC('month', NOW())
                  AND status IN ('confirmed', 'rescheduled')
              ) AS bookings_this_month,
              COUNT(*) FILTER (
                WHERE starts_at >= DATE_TRUNC('month', NOW())
                  AND status = 'cancelled'
              ) AS cancelled_this_month,
              COUNT(DISTINCT client_email) AS unique_clients_this_month
            FROM bookings
            WHERE business_id = %s
        """
        result = db.execute_one(query, (business_id,))
        return dict(result) if result else {}

    def get_upcoming_bookings(self, business_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Obtiene las próximas reservas de un negocio.

        Args:
            business_id: UUID del negocio
            limit: Cantidad de reservas a devolver

        Returns:
            Lista de diccionarios con datos de las próximas reservas
        """
        query = """
            SELECT b.id, b.client_name, b.starts_at, b.status,
                   p.display_name AS professional_name,
                   s.name AS service_name
            FROM bookings b
            LEFT JOIN professionals p ON b.professional_id = p.id
            LEFT JOIN services s ON b.service_id = s.id
            WHERE b.business_id = %s
              AND b.starts_at >= NOW()
              AND b.status IN ('confirmed', 'rescheduled')
            ORDER BY b.starts_at ASC
            LIMIT %s
        """
        results = db.execute_query(query, (business_id, limit))
        return [dict(r) for r in results] if results else []

    def get_bookings_today(self, business_id: str) -> List[Dict[str, Any]]:
        """Obtiene reservas confirmadas de hoy."""
        query = """
            SELECT b.id, b.client_name, b.starts_at, b.status,
                   p.display_name AS professional_name,
                   s.name AS service_name
            FROM bookings b
            LEFT JOIN professionals p ON b.professional_id = p.id
            LEFT JOIN services s ON b.service_id = s.id
            WHERE b.business_id = %s
              AND DATE(b.starts_at AT TIME ZONE 'America/Argentina/Buenos_Aires') = CURRENT_DATE
              AND b.status IN ('confirmed', 'rescheduled')
            ORDER BY b.starts_at ASC
        """
        results = db.execute_query(query, (business_id,))
        return [dict(r) for r in results] if results else []

    def get_bookings_this_week(self, business_id: str) -> List[Dict[str, Any]]:
        """Obtiene reservas confirmadas de esta semana."""
        query = """
            SELECT b.id, b.client_name, b.starts_at, b.status,
                   p.display_name AS professional_name,
                   s.name AS service_name
            FROM bookings b
            LEFT JOIN professionals p ON b.professional_id = p.id
            LEFT JOIN services s ON b.service_id = s.id
            WHERE b.business_id = %s
              AND b.starts_at >= DATE_TRUNC('week', NOW())
              AND b.status IN ('confirmed', 'rescheduled')
            ORDER BY b.starts_at ASC
        """
        results = db.execute_query(query, (business_id,))
        return [dict(r) for r in results] if results else []

    def get_bookings_this_month(self, business_id: str) -> List[Dict[str, Any]]:
        """Obtiene reservas confirmadas de este mes."""
        query = """
            SELECT b.id, b.client_name, b.starts_at, b.status,
                   p.display_name AS professional_name,
                   s.name AS service_name
            FROM bookings b
            LEFT JOIN professionals p ON b.professional_id = p.id
            LEFT JOIN services s ON b.service_id = s.id
            WHERE b.business_id = %s
              AND b.starts_at >= DATE_TRUNC('month', NOW())
              AND b.status IN ('confirmed', 'rescheduled')
            ORDER BY b.starts_at ASC
        """
        results = db.execute_query(query, (business_id,))
        return [dict(r) for r in results] if results else []

    def get_cancelled_bookings(self, business_id: str) -> List[Dict[str, Any]]:
        """Obtiene reservas canceladas de este mes."""
        query = """
            SELECT b.id, b.client_name, b.starts_at, b.status, b.cancellation_reason,
                   p.display_name AS professional_name,
                   s.name AS service_name
            FROM bookings b
            LEFT JOIN professionals p ON b.professional_id = p.id
            LEFT JOIN services s ON b.service_id = s.id
            WHERE b.business_id = %s
              AND b.starts_at >= DATE_TRUNC('month', NOW())
              AND b.status = 'cancelled'
            ORDER BY b.starts_at DESC
        """
        results = db.execute_query(query, (business_id,))
        return [dict(r) for r in results] if results else []

    def get_unique_clients(self, business_id: str) -> List[Dict[str, Any]]:
        """Obtiene lista de todos los clientes únicos (por email) - base de datos de clientes."""
        query = """
            SELECT
              b.client_email,
              MAX(b.client_name) AS client_name,
              MAX(b.client_phone) AS client_phone,
              COUNT(*) AS booking_count
            FROM bookings b
            WHERE b.business_id = %s
            GROUP BY b.client_email
            ORDER BY booking_count DESC, client_name ASC
        """
        results = db.execute_query(query, (business_id,))
        return [dict(r) for r in results] if results else []


# Instancia global única
dashboard_repo = DashboardRepository()
