# Backend — Sistema de Turnos y Reservas

Backend FastAPI para la plataforma de gestión de turnos y reservas.

## Requisitos

- Python 3.11+
- PostgreSQL (Supabase)

## Instalación

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o: venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Copiar archivo de entorno y completar variables
cp .env.example .env
```

## Ejecución

```bash
# Desarrollo (auto-reload)
uvicorn main:app --reload --port 8000

# Producción
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Documentación API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Tests

```bash
pytest tests/ -v
```

## Migraciones de base de datos

Las migraciones SQL están en `migrations/`. Ejecutar en orden:

```bash
# Ejemplo con psql
psql $DATABASE_URL -f migrations/001_create_users.sql
psql $DATABASE_URL -f migrations/002_create_businesses.sql
# ... continuar con el resto
```

## Estructura del proyecto

```
backend/
├── main.py              # Punto de entrada
├── config/              # Configuración y settings
├── routers/             # Endpoints (sin lógica de negocio)
├── controllers/         # Orquestación de flujo
├── services/            # Lógica de negocio
├── repositories/        # Acceso a base de datos
├── integrations/        # Servicios externos (Resend, MP, Google)
├── schemas/             # Modelos Pydantic
├── middleware/          # Auth, errores, logging
├── utils/               # Utilidades (logger, db, errors)
└── migrations/          # Migraciones SQL versionadas
```

## Variables de entorno

Ver `.env.example` para todas las variables requeridas.
