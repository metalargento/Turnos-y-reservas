"""
Cliente de base de datos PostgreSQL.
Conexión única reutilizable para toda la aplicación.
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
from config.settings import settings
from utils.logger import get_logger

logger = get_logger("db")


class Database:
    """
    Gestor de conexiones a PostgreSQL.

    Usa un único cliente reutilizable para toda la aplicación.
    Los resultados se devuelven como diccionarios (RealDictCursor).
    """

    def __init__(self):
        self._conn: Optional[psycopg2.extensions.connection] = None

    def connect(self) -> None:
        """Establece conexión con la base de datos."""
        try:
            self._conn = psycopg2.connect(
                dsn=settings.database_url,
                cursor_factory=RealDictCursor
            )
            logger.info("Conexión a base de datos establecida")
        except Exception as e:
            logger.error("Error al conectar a la base de datos", extra={"error": str(e)})
            raise

    def disconnect(self) -> None:
        """Cierra la conexión con la base de datos."""
        if self._conn:
            self._conn.close()
            self._conn = None
            logger.info("Conexión a base de datos cerrada")

    @contextmanager
    def cursor(self):
        """Context manager para obtener un cursor."""
        if not self._conn:
            self.connect()

        cursor = self._conn.cursor()
        try:
            yield cursor
        finally:
            cursor.close()

    @contextmanager
    def transaction(self):
        """Context manager para transacciones."""
        if not self._conn:
            self.connect()

        try:
            yield self._conn
            self._conn.commit()
        except Exception:
            self._conn.rollback()
            raise

    def execute_query(
        self,
        query: str,
        params: Optional[tuple] = None,
        fetch: bool = True
    ) -> List[Dict[str, Any]] | None:
        """
        Ejecuta una query y devuelve resultados si corresponde.

        Args:
            query: SQL con parámetros nombrados (%s)
            params: Tupla de parámetros
            fetch: Si True, devuelve resultados (SELECT). Si False, solo ejecuta (INSERT/UPDATE/DELETE)

        Returns:
            Lista de diccionarios o None
        """
        with self.cursor() as cursor:
            cursor.execute(query, params or ())
            if fetch:
                return cursor.fetchall()
            return None

    def execute_one(
        self,
        query: str,
        params: Optional[tuple] = None
    ) -> Optional[Dict[str, Any]]:
        """Ejecuta una query y devuelve un único resultado o None."""
        with self.cursor() as cursor:
            cursor.execute(query, params or ())
            result = cursor.fetchone()
            return dict(result) if result else None


# Instancia global única
db = Database()


def get_db() -> Database:
    """Obtener instancia de base de datos (para inyección de dependencias)."""
    return db
