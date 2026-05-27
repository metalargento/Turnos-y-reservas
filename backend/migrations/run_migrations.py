"""
Ejecutor automático de migraciones SQL.

Este módulo corre todas las migraciones pendientes en el startup de la aplicación.
Mantiene un registro en tabla `schema_migrations` de cuáles ya se ejecutaron.

Uso:
  from migrations.run_migrations import run_migrations
  run_migrations()  # en el startup de main.py
"""
import os
import glob
from pathlib import Path
import psycopg2
from config.settings import settings
from utils.logger import get_logger

logger = get_logger("migrations")


def run_migrations():
    """
    Ejecuta todas las migraciones SQL pendientes.

    Flujo:
    1. Conecta a la BD
    2. Crea tabla `schema_migrations` si no existe
    3. Lee archivos SQL en orden (001_*, 002_*, etc)
    4. Ejecuta los que aún no están registrados
    5. Registra cada una en la tabla
    """
    try:
        conn = psycopg2.connect(dsn=settings.database_url)
        conn.autocommit = True
        cursor = conn.cursor()

        # Especificar schema (necesario para Supabase Pooler)
        cursor.execute("SET search_path TO public;")

        # Crear tabla de control de migraciones
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT NOW()
            )
        """)
        logger.info("Tabla schema_migrations verificada")

        # Obtener migraciones ya ejecutadas
        cursor.execute("SELECT name FROM schema_migrations")
        executed = {row[0] for row in cursor.fetchall()}

        # Obtener archivos de migraciones
        migrations_dir = Path(__file__).parent
        migration_files = sorted(glob.glob(str(migrations_dir / "*.sql")))

        if not migration_files:
            logger.warning("No se encontraron archivos .sql en migrations/")
            cursor.close()
            conn.close()
            return

        # Ejecutar migraciones pendientes
        for migration_file in migration_files:
            migration_name = os.path.basename(migration_file)

            if migration_name in executed:
                logger.info(f"Migración ya ejecutada: {migration_name}")
                continue

            try:
                with open(migration_file, "r", encoding="utf-8") as f:
                    sql = f.read()

                # Ejecutar migración
                cursor.execute(sql)
                logger.info(f"Migración ejecutada: {migration_name}")

                # Registrar en tabla de control
                cursor.execute(
                    "INSERT INTO schema_migrations (name) VALUES (%s)",
                    (migration_name,)
                )

            except Exception as e:
                logger.error(f"Error en migración {migration_name}: {str(e)}")
                conn.close()
                raise

        logger.info("✅ Todas las migraciones completadas")
        cursor.close()
        conn.close()

    except Exception as e:
        logger.error(f"Error crítico en migraciones: {str(e)}")
        raise
