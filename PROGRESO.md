# Progreso del Desarrollo — Sistema de Turnos y Reservas

Este documento registra todo lo que se va construyendo en el proyecto, con explicaciones de qué es cada cosa y por qué se hizo así.

---

## Sesión 1: Estructura inicial + Autenticación + Onboarding

### Resumen

En esta sesión se construyó:
1. La estructura base del backend (arquitectura por capas)
2. El módulo de autenticación (registro, login, JWT)
3. El módulo de onboarding (5 pasos para activar un negocio)
4. Los repositories de negocio, sucursal y servicio

---

## Sesión 1.1: Estructura inicial + Autenticación

### Archivos de configuración base

#### `backend/requirements.txt`
Lista de dependencias del proyecto. Incluye:
- **FastAPI + uvicorn**: Framework web y servidor ASGI
- **pydantic + pydantic-settings**: Validación de datos y configuración desde entorno
- **python-jose + passlib[bcrypt]**: JWT y hash de passwords
- **psycopg2-binary**: Driver de PostgreSQL
- **resend**: Cliente de email transaccional
- **mercadopago**: SDK de pagos
- **google-auth + google-api-python-client**: Integración con Google Calendar
- **slowapi**: Rate limiting

> **Por qué:** Todas las dependencias tienen versión exacta para evitar problemas de compatibilidad y permitir auditoría de seguridad con `pip-audit`.

---

#### `backend/.env.example`
Plantilla de variables de entorno requeridas.

> **Por qué:** Cero secretos en el código. Este archivo se commitea al repo para que los devs sepan qué variables necesitan. El `.env` real está en `.gitignore`.

---

#### `backend/config/settings.py`
Módulo centralizado que lee variables de entorno y las exporta como objeto tipado.

```python
from config.settings import settings

# En cualquier parte del código
db_url = settings.database_url
jwt_secret = settings.jwt_secret
```

> **Por qué:** Si mañana cambiamos el nombre de una variable, solo se modifica este archivo. Todo el código importa `settings`, nunca `os.environ` directo.

---

#### `backend/.gitignore`
Archivos y carpetas que Git debe ignorar.

> **Por qué:** Evita commitear accidentalmente `.env`, `__pycache__`, `venv/`, etc.

---

#### `backend/pyproject.toml`
Configuración de Ruff (linter + formatter).

> **Por qué:** Reemplaza a Black, Flake8 e isort en una sola herramienta. Límite de 100 caracteres por línea.

---

### Estructura de carpetas

```
backend/
├── config/           # Configuración centralizada
├── routers/          # Endpoints HTTP (sin lógica de negocio)
├── controllers/      # Orquestación de flujo
├── services/         # Lógica de negocio
├── repositories/     # Acceso a base de datos
├── integrations/     # Wrappers de servicios externos
├── schemas/          # Modelos Pydantic
├── middleware/       # Auth, errores, logging
├── utils/            # Utilidades
├── migrations/       # SQL versionado
└── main.py           # Punto de entrada
```

> **Por qué (arquitectura por capas):** Cada capa tiene una responsabilidad única. Podés cambiar la DB sin tocar los routers. Podés cambiar los routers sin tocar los services. Esto hace que el código sea mantenible y testeable.

---

### Base de datos — Migraciones

#### `migrations/001_create_users.sql`
Tabla `users` — dueños y profesionales del sistema.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('owner', 'professional')),
    ...
);
```

> **Por qué UUID:** Los IDs secuenciales (1, 2, 3...) revelan información sensible (cuántos usuarios tenés). UUID es opaco y seguro.

---

#### `migrations/002_create_businesses.sql`
Tabla `businesses` — negocios suscriptos.

Campos clave:
- `slug`: URL pública (`reservas.dominio.com/peluqueria-juan`)
- `plan_status`: 'active', 'expired', 'cancelled'
- `email_provider`: 'resend' o 'smtp'
- `google_calendar_enabled`: boolean
- `min_advance_hours`: horas mínimas de anticipación

> **Por qué:** Un negocio puede tener múltiples sucursales, pero una sola configuración de marca/email/Google Calendar.

---

#### `migrations/003_create_branches.sql`
Tabla `branches` — sucursales de un negocio.

> **Por qué:** Un negocio puede tener "Casa central" y "Sucursal Norte" con direcciones y teléfonos distintos.

---

#### `migrations/004_create_professionals.sql`
Tabla `professionals` — profesionales vinculados a negocios.

> **Por qué:** Un profesional puede ser empleado de un negocio. Tiene un `user_id` opcional (si tiene login) y está asignado a una sucursal.

---

#### `migrations/005_create_services.sql`
Tabla `services` — servicios que ofrece el negocio.

```sql
CREATE TABLE services (
    id UUID,
    business_id UUID,
    name TEXT,
    duration_minutes INT,  -- clave para la lógica de disponibilidad
    price DECIMAL,
    ...
);
```

Y la tabla `professional_services` que relaciona profesionales con servicios que pueden hacer.

> **Por qué:** No todos los profesionales hacen todos los servicios. Un "Corte de cabello" puede durar 30 min, un "Color completo" 120 min.

---

#### `migrations/006_create_schedules.sql`
Dos tablas:
1. `availability` — disponibilidad semanal regular (ej: Lunes a Viernes 9:00-18:00)
2. `schedule_blocks` — bloqueos manuales (vacaciones, feriados)

> **Por qué:** La disponibilidad regular se repite cada semana. Los bloqueos son excepciones puntuales.

---

#### `migrations/007_create_bookings.sql`
Tabla `bookings` — reservas de clientes.

Campos clave:
- `client_name`, `client_email`, `client_phone`: datos del cliente (sin cuenta)
- `starts_at`, `ends_at`: tiempo del turno
- `status`: 'confirmed', 'cancelled', 'rescheduled', 'completed'
- `confirmation_token`: token único para cancelar/reprogramar sin cuenta
- `payment_status`: 'pending', 'paid', 'refunded'

> **Por qué:** El cliente final no necesita cuenta. Con el token que recibe por email puede gestionar su turno.

---

### Utilidades

#### `backend/utils/errors.py`
Clase `AppError` para errores tipados.

```python
raise AppError("Email duplicado", "EMAIL_ALREADY_EXISTS", 409)
```

> **Por qué:** Todos los errores tienen el mismo formato. El handler global los convierte a JSON automáticamente.

---

#### `backend/utils/logger.py`
Logger centralizado en formato JSON.

```python
from utils.logger import get_logger

logger = get_logger("auth_service")
logger.info("Login exitoso", extra={"user_id": user_id})
```

> **Por qué:** Los logs en JSON se pueden integrar con CloudWatch, Datadog, etc. Solo se loguean eventos de negocio importantes.

---

#### `backend/utils/db.py`
Cliente de PostgreSQL reutilizable.

```python
from utils.db import db

user = db.execute_one("SELECT * FROM users WHERE email = %s", (email,))
```

> **Por qué:** Una única conexión reutilizable. Los resultados vienen como diccionarios (RealDictCursor).

---

### Middleware

#### `backend/middleware/error_handler.py`
Handler global que captura todas las excepciones.

> **Por qué:** El cliente siempre recibe el mismo formato de error. Los errores inesperados se loguean completos pero no se exponen al cliente.

---

#### `backend/middleware/auth.py`
Middleware que verifica JWT en cada request.

Rutas públicas:
- `/health`
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/refresh`
- `/api/auth/verify-token`
- `/api/bookings/public/*` (cliente final sin cuenta)

> **Por qué:** Todas las rutas protegidas requieren token válido. Las rutas públicas están explícitamente listadas.

---

### Schemas

#### `backend/schemas/common.py`
Schemas comunes: `ErrorResponse`, `SuccessResponse`, `PaginatedResponse`, `TokenResponse`.

> **Por qué:** Respuestas consistentes en toda la API.

---

#### `backend/schemas/auth.py`
Schemas de autenticación:
- `RegisterRequest`: email, password, full_name, role
- `LoginRequest`: email, password
- `AuthResponse`: tokens + datos del usuario

Validaciones:
- Password: mín. 8 caracteres, 1 mayúscula, 1 número
- Email: formato válido (Pydantic EmailStr)
- Role: solo 'owner' o 'professional'

> **Por qué:** Validación en la frontera. Si el input no es válido, FastAPI devuelve 422 sin llegar a la lógica de negocio.

---

### Repositories

#### `backend/repositories/user_repo.py`
CRUD de usuarios:
- `create()`: crea usuario nuevo
- `find_by_email()`: busca por email (para login)
- `find_by_id()`: busca por ID
- `update()`: actualiza datos

> **Por qué:** Los repositories son el único punto que toca la DB. Si mañana cambiamos a otro ORM, solo modificamos esta capa.

---

### Services

#### `backend/services/auth_service.py`
Lógica de negocio de autenticación:
- `register()`: crea usuario + valida email duplicado
- `login()`: verifica password + genera tokens
- `refresh_tokens()`: rota tokens
- `verify_token()`: valida JWT

> **Por qué:** Los services no conocen HTTP ni la DB. Reciben datos limpios y devuelven datos. Los errores son `AppError` tipados.

---

### Controllers

#### `backend/controllers/auth_controller.py`
Orquesta el flujo entre router y service.

> **Por qué:** Los controllers no tienen lógica de negocio. Solo coordinan: reciben datos del router, llaman al service, devuelven respuesta.

---

### Routers

#### `backend/routers/auth_router.py`
Endpoints:
- `POST /api/auth/register`: registro
- `POST /api/auth/login`: login
- `POST /api/auth/refresh`: refresh de tokens
- `GET /api/auth/me`: datos del usuario actual
- `POST /api/auth/verify-token`: verificar token (público)

> **Por qué:** Los routers solo reciben requests y delegan. Sin lógica de negocio.

---

### Main

#### `backend/main.py`
Punto de entrada de FastAPI.

Registra:
- Handler global de errores
- Middleware de security headers
- Middleware de auth
- CORS
- Router de auth
- Events de startup/shutdown (conexión a DB)

---

### Documentación

#### `backend/README.md`
Instrucciones de instalación y ejecución.

---

#### `CLAUDE.md`
Contexto del proyecto para Claude Code.

> **Por qué:** Cuando Claude lee este archivo al empezar, conoce las convenciones y no inventa cosas.

---

## Próximo: Onboarding del negocio

Lo que sigue es el módulo de onboarding de 5 pasos:
1. Datos del negocio
2. Marca (logo, colores)
3. Primera sucursal
4. Servicios
5. Configuración de agenda (anticipación mínima, email, Google Calendar)

---

*Última actualización: 2026-04-28*

---

## Sesión 1.2: Onboarding del negocio (5 pasos)

### Schemas de onboarding

#### `backend/schemas/onboarding.py`
Schemas Pydantic para cada paso del wizard:

| Paso | Schema | Campos |
|---|---|---|
| 1 | `BusinessStepRequest` | name, rubro, description |
| 2 | `BrandStepRequest` | logo_url, primary_color, secondary_color |
| 3 | `BranchStepRequest` | branch_name, address, phone |
| 4 | `ServicesStepRequest` | services (lista de ServiceItemRequest) |
| 5 | `AgendaStepRequest` | min_advance_hours, email_provider, smtp_*, google_calendar_enabled |

Validaciones:
- Colores en formato hex (`#RRGGBB`)
- Duración de servicios: 15-480 minutos
- Email provider: solo 'resend' o 'smtp'
- Sanitización de nombres (remover caracteres especiales)

> **Por qué:** Cada paso tiene su propio schema para validar solo lo necesario en esa etapa. El paso 4 usa un schema anidado (`ServiceItemRequest`) para cada servicio.

---

### Repositories del negocio

#### `backend/repositories/business_repo.py`
Repository de negocios. Métodos principales:

| Método | Propósito |
|---|---|
| `create()` | Crea negocio con owner_id, name, slug, rubro |
| `find_by_id()` | Busca negocio por ID |
| `find_by_slug()` | Busca negocio por slug (para página pública) |
| `find_by_owner_id()` | Busca negocios de un owner |
| `update_brand()` | Actualiza logo y colores |
| `update_agenda_config()` | Actualiza configuración de agenda y emails |
| `mark_onboarding_completed()` | Marca onboarding como completado |
| `is_slug_available()` | Verifica si un slug está disponible |

> **Por qué:** El slug es único y se genera automáticamente desde el nombre del negocio ("Mi Peluquería" → "mi-peluqueria"). Si ya existe, se agrega un número incremental.

---

#### `backend/repositories/branch_repo.py`
Repository de sucursales. Métodos principales:

| Método | Propósito |
|---|---|
| `create()` | Crea sucursal |
| `find_by_id()` | Busca sucursal por ID |
| `find_by_business_id()` | Busca sucursales de un negocio |
| `update()` | Actualiza nombre, dirección, teléfono |
| `set_active()` | Activa/desactiva sucursal |
| `count_by_business()` | Cuenta sucursales de un negocio |

> **Por qué:** Un negocio puede tener múltiples sucursales. Cada sucursal tiene su propia agenda y profesionales.

---

#### `backend/repositories/service_repo.py`
Repository de servicios. Métodos principales:

| Método | Propósito |
|---|---|
| `create()` | Crea un servicio |
| `create_many()` | Crea múltiples servicios de una vez |
| `find_by_id()` | Busca servicio por ID |
| `find_by_business_id()` | Busca servicios de un negocio |
| `update()` | Actualiza nombre, duración, precio |
| `set_active()` | Activa/desactiva servicio |
| `count_by_business()` | Cuenta servicios de un negocio |

> **Por qué:** `create_many()` existe para el paso 4 del onboarding, donde el usuario carga varios servicios de una vez.

---

### Servicio de onboarding

#### `backend/services/onboarding_service.py`
Lógica de negocio del onboarding de 5 pasos.

**Métodos por paso:**

| Paso | Método | Qué hace |
|---|---|---|
| 1 | `step_1_create_business()` | Crea negocio + genera slug único |
| 2 | `step_2_update_brand()` | Actualiza logo y colores |
| 3 | `step_3_create_branch()` | Crea primera sucursal |
| 4 | `step_4_create_services()` | Crea lista de servicios |
| 5 | `step_5_update_agenda_config()` | Configura agenda + marca onboarding completado |

**Método utilitario:**
- `get_onboarding_progress()`: Devuelve qué pasos están completos y cuál es el próximo

**Función interna:**
- `_generate_unique_slug()`: Convierte nombre a slug y verifica disponibilidad

> **Por qué:** El paso 5 encripta la password SMTP con bcrypt antes de guardarla en la DB. Nunca se guarda texto plano.

---

### Controller de onboarding

#### `backend/controllers/onboarding_controller.py`
Orquesta el flujo entre router y service.

**Características:**
- Extrae el `owner_id` del token JWT en cada paso
- Verifica que el usuario sea owner del negocio en pasos 2-5
- Devuelve respuestas consistentes

> **Por qué:** El controller no tiene lógica de negocio. Solo coordina: recibe datos, llama al service, devuelve respuesta.

---

### Router de onboarding

#### `backend/routers/onboarding_router.py`
Endpoints del onboarding:

| Método | Endpoint | Paso | Descripción |
|---|---|---|---|
| POST | `/api/onboarding/step-1` | 1 | Crear negocio |
| PUT | `/api/onboarding/step-2/{business_id}` | 2 | Configurar marca |
| POST | `/api/onboarding/step-3/{business_id}` | 3 | Crear sucursal |
| POST | `/api/onboarding/step-4/{business_id}` | 4 | Crear servicios |
| PUT | `/api/onboarding/step-5/{business_id}` | 5 | Configurar agenda |
| GET | `/api/onboarding/{business_id}/progress` | - | Ver progreso |
| GET | `/api/onboarding/my-business` | - | Obtener negocio del usuario |

**Endpoints protegidos:** Todos requieren token JWT en header `Authorization: Bearer <token>`.

**Verificación de ownership:** Los pasos 2-5 verifican que el usuario autenticado es owner del negocio antes de permitir modificaciones.

> **Por qué:** Cada endpoint tiene docstrings explicando qué hace y qué datos requiere. Esto se refleja en `/docs` (Swagger UI).

---

### Flujo completo de onboarding

```
1. Usuario se registra → POST /api/auth/register
   ↓
   Recibe access_token y refresh_token

2. Paso 1: Crear negocio → POST /api/onboarding/step-1
   Headers: Authorization: Bearer <token>
   Body: { "name": "Mi Peluquería", "rubro": "Belleza" }
   ↓
   Recibe: { "business_id": "uuid", "slug": "mi-peluqueria", ... }

3. Paso 2: Configurar marca → PUT /api/onboarding/step-2/{business_id}
   Body: { "primary_color": "#0000FF", "secondary_color": "#FFFFFF" }
   ↓
   Marca actualizada

4. Paso 3: Crear sucursal → POST /api/onboarding/step-3/{business_id}
   Body: { "branch_name": "Casa central", "address": "Av. Siempre 123" }
   ↓
   Sucursal creada

5. Paso 4: Crear servicios → POST /api/onboarding/step-4/{business_id}
   Body: {
     "services": [
       { "name": "Corte", "duration_minutes": 30, "price": 1500 },
       { "name": "Barba", "duration_minutes": 20, "price": 800 }
     ]
   }
   ↓
   Servicios creados

6. Paso 5: Configurar agenda → PUT /api/onboarding/step-5/{business_id}
   Body: { "min_advance_hours": 2, "email_provider": "resend" }
   ↓
   onboarding_completed = TRUE
   Negocio activo y listo para recibir reservas
```

---

### Archivos actualizados

#### `backend/main.py`
Se agregó:
- Import del `onboarding_router`
- Registro del router con `app.include_router(onboarding_router)`

---

### Próximos pasos

Lo que sigue en el roadmap:
1. **Módulo de profesionales** — CRUD de profesionales y asignación a servicios
2. **Módulo de reservas** — Crear, cancelar, reprogramar turnos
3. **Lógica de disponibilidad** — Calcular horarios disponibles según agenda y bloqueos
4. **Emails transaccionales** — Integración con Resend para confirmaciones
5. **Webhook de Mercado Pago** — Activación automática del plan
6. **Frontend panel admin** — React + Vite para que el owner gestione su negocio

---

*Resumen de la sesión:*
- **Archivos nuevos:** 8 (3 repos, 1 service, 1 controller, 1 router, 1 schema, actualizado main.py)
- **Endpoints nuevos:** 7 (5 pasos + progress + my-business)
- **Tablas usadas:** businesses, branches, services (ya creadas en migraciones)
