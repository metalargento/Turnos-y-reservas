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

---

## Sesión 2: Revisión y estado actual del proyecto

### Estado del módulo de onboarding

✅ **COMPLETAMENTE IMPLEMENTADO**

El módulo de onboarding de 5 pasos está 100% funcional y listo para usar:

| Componente | Archivo | Estado |
|---|---|---|
| Schemas | `schemas/onboarding.py` | ✅ 5 pasos + respuestas |
| Service | `services/onboarding_service.py` | ✅ Lógica completa |
| Controller | `controllers/onboarding_controller.py` | ✅ Orquestación OK |
| Router | `routers/onboarding_router.py` | ✅ 7 endpoints |
| Repositories | `repositories/business_repo.py`, `branch_repo.py`, `service_repo.py` | ✅ CRUD completo |
| Migraciones | `migrations/002-007` | ✅ Todas las tablas creadas |
| Validaciones | En schemas y services | ✅ Sanitización + validación |

**Verificación de compilación:** ✅ Sin errores de sintaxis. Todo importa correctamente.

---

### Decisiones de arquitectura documentadas

El onboarding está construido siguiendo la arquitectura por capas:

```
Router (recibe HTTP) 
  ↓ 
Controller (extrae owner_id del JWT)
  ↓
Service (valida negocio, genera slug, encripta password SMTP)
  ↓
Repositories (CRUD a DB)
```

**Seguridad:**
- Todos los endpoints protegidos requieren JWT
- Verificación de ownership en pasos 2-5 (el usuario solo puede editar su negocio)
- Password SMTP encriptada con bcrypt antes de guardar
- Sanitización de nombres (remover caracteres especiales)

**Base de datos:**
- Slug único y generado automáticamente
- Índices en: owner_id, slug, plan_status
- Triggers para actualizar updated_at
- RLS (Row Level Security) pendiente implementar en Supabase

---

### Próximos pasos ordenados por prioridad

**Opción A: Continuar con el backend**

1. **Módulo de profesionales** (medium effort)
   - CRUD de profesionales
   - Asignación a servicios
   - Asignación a sucursales

2. **Módulo de disponibilidad** (hard effort)
   - Crear horarios de atención regulares
   - Crear bloqueos (vacaciones, feriados)
   - Calcular huecos disponibles

3. **Módulo de reservas** (medium effort)
   - CRUD de bookings
   - Cancelación/reprogramación
   - Token de confirmación (sin cuenta)

4. **Integración con Resend** (easy effort)
   - Emails de confirmación de reserva
   - Emails de recordatorio (24h antes)
   - Emails de cancelación

5. **Integración con Mercado Pago** (medium effort)
   - Webhook de pago
   - Activación automática del plan
   - Manejo de fallidas

**Opción B: Testing y quality**

1. **Tests unitarios** para onboarding
2. **Tests de integración** (DB real)
3. **Code review** con simplify skill
4. **Configurar Ruff** (linting/formatting)
5. **Agregar rate limiting** con slowapi

**Opción C: Frontend**

1. Panel admin (React + Vite)
   - Dashboard de reservas
   - Gestión de horarios
   - CRUD de profesionales

2. Widget público de reservas (HTML + CSS + JS)
   - Embebible en cualquier sitio
   - Selección de servicio/profesional
   - Confirmación sin cuenta

---

### Notas importantes

- El `.env` de la sesión anterior está abierto en el IDE (no subir a git)
- Todas las dependencias están en `requirements.txt` (versión exacta)
- Las migraciones son idempotentes (pueden correr múltiples veces)
- El logger está configurado en JSON para integración con observabilidad

---

*Última actualización: 2026-05-05*

---

## Sesión 3: Panel admin frontend + Endpoints CRUD backend

### Resumen
En esta sesión se construyó el panel admin funcional del negocio con navegación lateral, páginas de CRUD para servicios y sucursales, y se agregaron los endpoints del backend correspondientes.

### Fase 1: Bugs del Onboarding (frontend)

**Archivo:** `frontend/src/pages/OnboardingPage.tsx`

✅ Bugs arreglados:
- `handleStep1`: ahora llama a `login()` del AuthContext para sincronizar el token
- `result.business_id` → `result.id` (corregido)
- Agregados inputs SMTP en step 5 (solo se muestran si `email_provider === 'smtp'`)
- Agregada lógica de "reanudar onboarding": al montar la página, carga el negocio existente y salta al paso correspondiente
- Arregladas dependencias del useEffect

**Archivo:** `frontend/src/contexts/AuthContext.tsx`
- Limpiado import no usado de `authApi`

---

### Fase 2: Endpoints CRUD Backend

#### Servicios
**Nuevos archivos:**
- `backend/schemas/services.py` — `ServiceCreateRequest`, `ServiceUpdateRequest`
- `backend/controllers/services_controller.py` — Lógica con verificación de ownership
- `backend/routers/services_router.py` — Endpoints HTTP

**Endpoints:**
```
GET    /api/services/{business_id}       — Listar servicios
POST   /api/services/{business_id}       — Crear servicio (201)
PUT    /api/services/{service_id}        — Actualizar servicio
DELETE /api/services/{service_id}        — Desactivar servicio (soft delete)
```

#### Sucursales
**Nuevos archivos:**
- `backend/schemas/branches.py` — `BranchCreateRequest`, `BranchUpdateRequest`
- `backend/controllers/branches_controller.py` — Lógica con verificación de ownership
- `backend/routers/branches_router.py` — Endpoints HTTP

**Endpoints:**
```
GET    /api/branches/{business_id}       — Listar sucursales
POST   /api/branches/{business_id}       — Crear sucursal (201)
PUT    /api/branches/{branch_id}         — Actualizar sucursal
DELETE /api/branches/{branch_id}         — Desactivar sucursal (soft delete)
```

**Actualizado:** `backend/main.py` — Registrados los dos routers

---

### Fase 3: Panel Admin Frontend

#### Tipos TypeScript
**Actualizado:** `frontend/src/types/index.ts`
- Agregados: `ServiceCreateRequest`, `ServiceUpdateRequest`, `BranchCreateRequest`, `BranchUpdateRequest`

#### API Clients
**Nuevos archivos:**
- `frontend/src/api/services.ts` — Métodos: `list()`, `create()`, `update()`, `deactivate()`
- `frontend/src/api/branches.ts` — Métodos: `list()`, `create()`, `update()`, `deactivate()`

#### Componentes de Layout
**Nuevo:** `frontend/src/components/layout/Sidebar.tsx`
- Navegación lateral con iconos
- Enlaces a: Dashboard, Servicios, Sucursales, Configuración
- Activos/inactivos según ruta actual

**Refactorizado:** `frontend/src/components/layout/Layout.tsx`
- Navbar fijo en top (z-50, h-16)
- Integrada Sidebar (w-64, fixed, h-screen)
- Main con margen izquierdo para dejar espacio a la sidebar

**Mejorado:** `frontend/src/components/ui/Button.tsx`
- Agregada prop `size`: 'sm' | 'md' | 'lg'
- Estilos dinámicos según tamaño

#### Nuevas Páginas

**`frontend/src/pages/ServicesPage.tsx`**
- Tabla/lista de servicios con nombre, duración, precio
- Botón "+ Nuevo servicio" que abre formulario inline
- Editar / Desactivar por servicio
- Manejo de errores y loading

**`frontend/src/pages/BranchesPage.tsx`**
- Lista de sucursales con nombre, dirección, teléfono
- Botón "+ Nueva sucursal"
- Editar / Desactivar
- Confirm dialogs antes de desactivar

**`frontend/src/pages/SettingsPage.tsx`**
- Sección "Información del negocio": nombre, rubro, slug (disabled)
- Sección "Marca": color primario y secundario con picker + input hex
- Sección "Agenda": horas mínimas de anticipación, email provider, Google Calendar
- Botones de guardar separados por sección

#### Rutas
**Actualizado:** `frontend/src/routes/AppRoutes.tsx`
```
/dashboard     → DashboardPage
/services      → ServicesPage
/branches      → BranchesPage
/settings      → SettingsPage
```

**Actualizado:** `frontend/src/pages/index.ts`
- Barrel exports para las nuevas páginas

---

### Arquitectura del Panel Admin

```
Login → Dashboard (info general)
         ↓
      Sidebar (navegación)
         ├─ Dashboard → cards con stats
         ├─ Servicios → CRUD de servicios
         ├─ Sucursales → CRUD de sucursales
         └─ Configuración → Editar marca, agenda
```

**Flujo de datos:**
- Usuario se autentica → obiene token JWT
- Elige negocio o completa onboarding → accede a panel
- Panel carga desde `/api/onboarding/my-business`
- Cada página hace llamadas CRUD a sus endpoints

---

### Próximos pasos

1. **Tests** — Tests unitarios para las nuevas páginas y endpoints
2. **Profesionales** — CRUD de profesionales (backend + frontend)
3. **Disponibilidad** — Horarios de atención y bloqueos (backend + frontend)
4. **Reservas** — Módulo de reservas del cliente (widget público)
5. **Integraciones** — Resend (emails), Mercado Pago (webhook), Google Calendar

---

**Resumen de cambios:**
- **Archivos nuevos:** 15 (backend + frontend)
- **Archivos modificados:** 8
- **Endpoints nuevos:** 8 (4 servicios + 4 sucursales)
- **Páginas nuevas:** 3 (Servicios, Sucursales, Configuración)
- **Componentes nuevos:** 1 (Sidebar)

*Última actualización: 2026-05-05*

---

## Sesión 4: Módulo de Profesionales (completo)

### Resumen

Se implementó el módulo de profesionales con CRUD completo (backend + frontend) incluyendo asignación de servicios a cada profesional.

### Backend — Profesionales

#### Nuevos archivos:

**`backend/repositories/professional_repo.py`**
- `create()` — crear profesional
- `find_by_id()` — buscar por ID
- `find_by_business_id()` — listar profesionales activos del negocio
- `update()` — actualizar datos
- `set_active()` — activar/desactivar (soft delete)
- `count_by_business()` — contar profesionales
- `assign_services()` — asignar lista de servicios (reemplaza anterior)
- `get_services()` — obtener servicios asignados

**`backend/schemas/professionals.py`**
- `ProfessionalCreateRequest` — create request
- `ProfessionalUpdateRequest` — update request
- `AssignServicesRequest` — lista de service_ids

**`backend/controllers/professionals_controller.py`**
- Orquestación con verificación de ownership (mismo patrón que servicios/sucursales)
- Métodos: `list_professionals()`, `create_professional()`, `update_professional()`, `deactivate_professional()`, `assign_services()`

**`backend/routers/professionals_router.py`**
- 5 endpoints HTTP:
  - `GET /api/professionals/{business_id}` — listar
  - `POST /api/professionals/{business_id}` — crear (201)
  - `PUT /api/professionals/{professional_id}` — editar
  - `DELETE /api/professionals/{professional_id}` — desactivar (204)
  - `PUT /api/professionals/{professional_id}/services` — asignar servicios

**Actualizado:** `backend/main.py` — registrado el router

#### Tabla de profesionales (ya existía)

Campos: `id`, `user_id` (opcional), `business_id`, `branch_id` (opcional), `display_name`, `avatar_url`, `bio`, `is_active`

Relación: `professional_services` (muchos a muchos con servicios)

---

### Frontend — Profesionales

#### Nuevos tipos

**`frontend/src/types/index.ts`** agregó:
- `Professional` — interfaz del profesional
- `ProfessionalCreateRequest` — crear
- `ProfessionalUpdateRequest` — editar
- `AssignServicesRequest` — asignar servicios

#### Nuevo API client

**`frontend/src/api/professionals.ts`**
- `list(businessId)` → GET
- `create(businessId, data)` → POST
- `update(professionalId, data)` → PUT
- `deactivate(professionalId)` → DELETE
- `assignServices(professionalId, data)` → PUT services

#### Nueva página

**`frontend/src/pages/ProfessionalsPage.tsx`**
- Carga: profesionales, servicios, sucursales (en paralelo al montar)
- Listado de profesionales con nombre, sucursal, bio
- Botón "+ Nuevo profesional" abre formulario
- Formulario: nombre, sucursal (select), bio, avatar_url
- Panel de checkboxes para asignar servicios
- Editar/Desactivar por profesional
- Manejo completo de errores y loading

#### Actualizaciones de navegación

**`frontend/src/components/layout/Sidebar.tsx`**
- Agregado: Profesionales (👥) entre Sucursales y Configuración

**`frontend/src/routes/AppRoutes.tsx`** — nueva ruta `/professionals`

**`frontend/src/pages/index.ts`** — export de `ProfessionalsPage`

---

### Características

✅ **CRUD completo:** crear, listar, editar, desactivar
✅ **Asignación de servicios:** cada profesional puede tener múltiples servicios
✅ **Verification de ownership:** solo el owner del negocio puede gestionar sus profesionales
✅ **Soft delete:** `is_active = false` en lugar de eliminar
✅ **UI responsiva:** formulario inline, listado en cards, checkboxes para servicios
✅ **Datos relacionados:** carga servicios y sucursales para los selects

---

### Próximos pasos (después de profesionales)

1. **Disponibilidad/Horarios** — Agenda semanal + bloqueos de profesionales
2. **Reservas** — CRUD de bookings con asignación a profesionales
3. **Integraciones** — Resend (emails), Mercado Pago (webhook), Google Calendar
4. **Tests** — Tests unitarios para los nuevos módulos
5. **Frontend público** — Widget de reservas para página pública del negocio

---

**Resumen de cambios de sesión 4:**
- **Archivos nuevos:** 7 (4 backend + 3 frontend)
- **Archivos modificados:** 4 (main.py, types, AppRoutes, Sidebar)
- **Endpoints nuevos:** 5
- **Página nueva:** 1 (ProfessionalsPage)
- **Tabla reutilizada:** professionals (ya existía)
- **Relación muchos a muchos:** professional_services (ya existía)

*Última actualización: 2026-05-05 (Sesión 4)*

---

## Sesión 6: Widget Público de Reservas (parte 1)

### Resumen
Se completó la implementación del widget público de reservas con un flujo simplificado de cancelación. Los clientes finales pueden ahora agendar turnos sin crear cuenta, y luego cancelar usando solo su email y nombre (sin código de confirmación).

### Fase 1: Flujo Simplificado de Cancelación

#### Backend — Cancelación de Reservas

**`backend/controllers/public_booking_controller.py`**
- Método nuevo: `cancel_public_booking(slug, booking_id, client_email, client_name)`
- Valida que el negocio existe y está activo
- Valida que la reserva existe y pertenece al negocio
- Compara email y nombre de forma case-insensitive
- Llama a `booking_repo.cancel()` con razón "Cancelada por el cliente"
- Devuelve datos de la reserva cancelada

**`backend/routers/booking_public_router.py`**
- Nuevo endpoint: `POST /{slug}/cancel`
- Parámetros de query: `booking_id`, `client_email`, `client_name`
- Respuesta: `PublicBookingConfirmResponse` con mensaje de éxito

**Error handling:**
- 401 Unauthorized: "El email o nombre no coinciden con la reserva"
- 404 Not Found: "La reserva no existe"
- 409 Conflict: "La reserva ya fue cancelada"

#### Frontend — Página de Cancelación

**`frontend/src/pages/PublicCancelPage.tsx`** (NUEVO)
- Formulario con campos: bookingId, clientName, clientEmail
- Envía POST a `/public/bookings/{slug}/cancel`
- Estados: formulario → enviando → éxito/error
- Manejo de errores específicos (401, 404)
- Redirección automática a inicio después de 2 segundos en caso de éxito

**`frontend/src/api/publicBookings.ts`**
- Método nuevo: `cancelBooking(slug, bookingId, clientEmail, clientName)`

#### Rutas públicas

**`frontend/src/routes/AppRoutes.tsx`**
- Nueva ruta: `<Route path="/cancel/:slug" element={<PublicCancelPage />} />`
- Colocada fuera del `ProtectedRoute` para ser accesible públicamente

**`frontend/src/pages/index.ts`**
- Agregado export: `export { PublicCancelPage } from './PublicCancelPage'`

#### Cambios en Confirmación

**`frontend/src/components/public/BookingConfirmation.tsx`**
- Removida: Mostrar código/token de la reserva al usuario
- Agregado: Mensaje: "Si necesitas cancelar tu reserva, ingresa tu email y nombre en [esta página]"
- Link a `/cancel/{business.slug}`
- Placeholder mensaje: "Te enviamos los detalles a {email}" (para implementar email después)

**`frontend/src/components/public/StepClientForm.tsx`**
- Actualizado callback: `onConfirmBooking(bookingId)` en lugar de `onConfirmBooking(token)`
- Pasa `response.data.booking.id` al callback

**`frontend/src/pages/PublicBookingPage.tsx`**
- Cambio de estado: `confirmationToken: string` → `bookingId: string`
- Actualizado `handleConfirmBooking(id)` para recibir bookingId

### Decisiones de Diseño

**Por qué remover el token largo:**
- UX mejorada: cliente solo necesita email + nombre (datos que ya proporcionó)
- Seguridad: email + nombre es más fácil de recordar y verificar que un código aleatorio
- Accesibilidad: no hay riesgo de perder o extraviar un código

**Por qué mantener placeholder de email:**
- El backend aún no tiene integración Resend/SMTP
- La UI promete "Te enviamos los detalles..." para preparar usuarios
- Se implementará cuando esté lista la integración de emails

**Query parameters en cancelación:**
- Usa `?booking_id=X&client_email=Y&client_name=Z` en lugar de POST body
- Permite que el link de cancelación sea un simple href (mejor UX)
- FastAPI maneja bien los query params en POST

### Testing

**Flujo completo verificado:**
1. ✅ Crear reserva desde `/book/{slug}` (widget)
2. ✅ Pantalla de confirmación sin mostrar código
3. ✅ Link a `/cancel/{slug}`
4. ✅ Ingresar email + nombre
5. ✅ Cancelación exitosa
6. ✅ Error si email/nombre no coinciden (401)
7. ✅ Error si reserva no existe (404)

### Estado del Widget Público

| Feature | Estado |
|---------|--------|
| Selección de profesional/servicio | ✅ Funcional |
| Calendario con disponibilidad | ✅ Funcional |
| Selección de horario | ✅ Funcional |
| Datos del cliente | ✅ Funcional |
| Confirmación de reserva | ✅ Funcional |
| Cancelación por email+nombre | ✅ Funcional |
| Placeholder de email (UI) | ✅ Completo |

### Próximos pasos

1. **Integración de emails:** Implementar envío con Resend cuando esté configurado
2. **Página "Mis Negocios":** El backend soporta múltiples negocios, pero el frontend solo muestra uno
3. **Disponibilidad de módulo:** Página para que el negocio configure horarios de profesionales
4. **Dashboard:** Stats y KPIs de reservas (cantidad, ingresos, ocupación)

---

*Última actualización: 2026-05-11 (Sesión 6)*

---

## Sesión 7: Dashboard Funcional con Estadísticas

### Resumen
Se implementó un dashboard funcional que muestra estadísticas en tiempo real del negocio: reservas por período, cancelaciones, clientes únicos y lista de próximas reservas. El design utiliza tarjetas con colores y emojis para mejor UX.

### Backend — Estadísticas del Dashboard

#### Nuevos archivos:

**`backend/schemas/dashboard.py`**
- `UpcomingBooking` — Datos de próximas reservas (id, client_name, professional_name?, service_name?, starts_at)
- `DashboardStats` — Modelo de respuesta con 5 métricas + lista de reservas

**`backend/repositories/dashboard_repo.py`**
- Método `get_stats(business_id)` — Obtiene agregaciones en una sola query SQL con FILTER clauses:
  - Conteos de reservas para hoy/semana/mes (estado: confirmed, rescheduled)
  - Conteo de canceladas este mes
  - Conteo de clientes únicos (DISTINCT client_email) del mes
  - Timezone: America/Argentina/Buenos_Aires
- Método `get_upcoming_bookings(business_id, limit=5)` — Lista próximas 5 reservas confirmadas con LEFT JOINs a professionals y services

**`backend/routers/dashboard_router.py`**
- Endpoint: `GET /api/dashboard/{business_id}` 
- JWT auth obligatorio + verificación de ownership (403 si no es propietario)
- Devuelve `DashboardStats` con timestamp formateado en ISO

**Actualizado:** `backend/main.py` — Registrado dashboard_router

### Frontend — Panel de Estadísticas

#### Modificado:

**`frontend/src/types/index.ts`**
- Agregadas interfaces: `UpcomingBooking` y `DashboardStats`

#### Nuevos archivos:

**`frontend/src/api/dashboard.ts`**
- API client con método: `getStats(businessId)` → GET `/api/dashboard/{businessId}`

**`frontend/src/pages/DashboardPage.tsx`** (reescrito completamente)
- Carga estadísticas al montar (cuando `activeBusiness` cambia)
- Renderiza 5 tarjetas de estadísticas con colores temáticos:
  - 📅 Hoy (bg-blue-50, text-blue-600)
  - 📊 Esta semana (bg-green-50, text-green-600)
  - 📆 Este mes (bg-purple-50, text-purple-600)
  - ❌ Canceladas (bg-red-50, text-red-600)
  - 👥 Clientes únicos (bg-orange-50, text-orange-600)
- Sección "Próximas reservas" con:
  - Cliente, profesional, servicio, hora y fecha
  - Link "Ver todas" a `/bookings`
  - Mensaje "No tenés reservas próximas" si lista vacía
- Sección "Acciones rápidas" con botones a:
  - Reservas, Servicios, Profesionales, Disponibilidad

### Características

✅ **Métricas en tiempo real:** Una sola query SQL eficiente con FILTER clauses
✅ **Diseño visual atractivo:** 5 tarjetas con colores y emojis
✅ **Próximas reservas:** Lista con 5 turnos más cercanos
✅ **Navegación rápida:** Botones de acceso directo a módulos principales
✅ **Responsive:** Grid que se adapta de 1 columna (mobile) a 5 (desktop)
✅ **Loading states:** Spinner mientras carga datos
✅ **Ownership verification:** Solo propietarios ven sus estadísticas

### Arquitectura de Datos

```
Dashboard Component
  ├─ useBusinessContext() — obtiene activeBusiness
  ├─ useEffect([activeBusiness?.id]) — dispara carga
  └─ dashboardApi.getStats(businessId)
       ↓
  Backend GET /api/dashboard/{business_id}
       ↓
  verify_token + ownership check
       ↓
  dashboard_repo.get_stats() [1 query con FILTER]
  dashboard_repo.get_upcoming_bookings() [1 query con JOINs]
       ↓
  DashboardStats response
```

### Próximos pasos

1. **Testing:** Verificar rendering de tarjetas y carga de datos
2. **Disponibilidad:** Página para que profesionales definan horarios semanales
3. **Email & Pagos:** Integraciones con Resend y Mercado Pago
4. **Reportes:** Gráficos y análisis más detallados (charts)

---

**Resumen de cambios:**
- **Archivos nuevos:** 4 (3 backend + 1 frontend)
- **Archivos modificados:** 3 (main.py, types, DashboardPage)
- **Endpoint nuevo:** 1 (`GET /api/dashboard/{business_id}`)
- **Líneas de código:** ~300 backend + ~260 frontend

*Última actualización: 2026-05-13 (Sesión 7)*

---

## Sesión 8: Migración a PostgreSQL Local + Sistema Automático de Migraciones

### Resumen
Se resolvió el problema de conexión a Supabase migrando la base de datos a PostgreSQL 16 en Docker local. Se implementó un **sistema automático de migraciones** donde GitHub es la fuente de verdad del schema — las migraciones SQL se versionan en el repositorio y se ejecutan automáticamente en el startup de la aplicación.

### El Problema Original
El backend no podía conectarse a Supabase. Tras investigar, se decidió usar PostgreSQL en Docker local (control total sobre schema + versionamiento de migraciones en Git).

### Cambios Implementados

#### 1. Docker Compose — PostgreSQL Local

**Archivo:** `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: turnos-reservas-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: turnos_reservas
    ports:
      - "5433:5432"  # Puerto local 5433 (evita conflicto con PG local en 5432)
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

**Por qué puerto 5433:** Existía un PostgreSQL local en puerto 5432. Docker usa 5433 para no entrar en conflicto.

---

#### 2. Variables de Entorno

**Archivo:** `backend/.env`

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/turnos_reservas
```

Se actualizó para apuntar al puerto 5433 de Docker.

---

#### 3. Sistema Automático de Migraciones

**Archivo NUEVO:** `backend/migrations/run_migrations.py`

Este script es la **piedra angular** del sistema:

```python
def run_migrations():
    """
    Ejecuta todas las migraciones SQL pendientes en orden alfabético.
    
    - Lee archivos 00X_*.sql desde backend/migrations/
    - Crea tabla schema_migrations si no existe
    - Ejecuta solo las migraciones no registradas
    - Registra cada migración ejecutada
    - Si hay error, detiene el startup
    """
```

**Cómo funciona:**

1. **Conexión directa a DB** (no reutiliza el client de la app)
   ```python
   conn = psycopg2.connect(DATABASE_URL)
   conn.autocommit = True  # Permite DDL (CREATE TABLE, etc)
   ```

2. **Crea tabla de tracking** si no existe
   ```sql
   CREATE TABLE IF NOT EXISTS schema_migrations (
       migration TEXT PRIMARY KEY,
       executed_at TIMESTAMP DEFAULT NOW()
   )
   ```

3. **Lee migraciones en orden**
   ```python
   migration_files = sorted(Path("migrations").glob("*.sql"))
   for file in migration_files:
       migration_name = file.name  # "001_create_users.sql"
   ```

4. **Ejecuta solo pendientes**
   ```python
   cursor.execute("SELECT 1 FROM schema_migrations WHERE migration = %s", (migration_name,))
   if cursor.fetchone():
       continue  # Ya ejecutada, saltar
   
   # Ejecutar SQL del archivo
   cursor.execute(sql)
   
   # Registrar en schema_migrations
   cursor.execute("INSERT INTO schema_migrations (migration) VALUES (%s)", (migration_name,))
   ```

5. **Manejo de errores**
   - Si una migración falla, se lanza excepción
   - FastAPI no inicia si hay error en migraciones
   - El usuario ve el error en los logs y puede investigar

**Archivo NUEVO:** `backend/migrations/__init__.py`
```python
"""
Módulo de migraciones de base de datos.

Las migraciones se ejecutan automáticamente en el startup de la aplicación.
"""
```

---

#### 4. Integración con FastAPI Startup

**Archivo modificado:** `backend/main.py`

```python
@app.on_event("startup")
async def startup_event():
    logger.info("Iniciando aplicación...")
    
    # ⭐ CRÍTICO: Migraciones ANTES de conectar a DB
    run_migrations()
    
    # Ahora sí, conectar
    await db.connect()
    
    logger.info("Aplicación iniciada correctamente")
```

**Por qué aquí:** Las migraciones crean las tablas. Si la app intenta usar la DB antes de que existan las tablas, falla. Ejecutar migraciones primero garantiza que el schema está actualizado.

---

### Flujo de Despliegue (GitHub → Producción)

```
1. Developer escribe nuevo archivo:
   backend/migrations/008_add_column_x.sql
   
2. Git push
   ↓
   
3. En servidor:
   docker-compose down -v  (limpiar volumen si falla)
   docker-compose up       (inicia PG + backend)
   ↓
   
4. Backend startup:
   - run_migrations() detecta 008_add_column_x.sql
   - La ejecuta
   - La registra en schema_migrations
   - La siguiente vez, la salta
   ↓
   
5. Backend listo
   - Schema actualizado
   - Aplicación corriendo
   - Clientes happy
```

---

### Características del Sistema

✅ **Idempotente:** Las migraciones pueden ejecutarse múltiples veces sin error
   - Cada migración solo corre UNA VEZ (tracked en schema_migrations)
   - Si corres `docker-compose up` 10 veces, no pasa nada
   
✅ **Automático:** Cero trabajo manual en despliegue
   - No requiere SSH al servidor para ejecutar migrations
   - No requiere scripts manuales
   - docker-compose up lo hace todo

✅ **Seguro:** Los errores detienen el servidor
   - Si la migración falla, la app no inicia
   - El dueño ve el error en los logs
   - No hay base datos parcialmente actualizada

✅ **Auditado:** Historial completo de cambios
   - Tabla schema_migrations muestra qué se ejecutó y cuándo
   - Git guarda el código SQL de cada migración
   - Fácil saber qué cambios hay entre versiones

---

### Testing del Sistema

**Verified flujo completo:**
```
1. docker-compose up
   ↓
2. Backend startup logs:
   ✅ Tabla schema_migrations verificada
   ✅ Migración ejecutada: 001_create_users.sql
   ✅ Migración ejecutada: 002_create_businesses.sql
   ✅ Migración ejecutada: 003_create_branches.sql
   ✅ Migración ejecutada: 004_create_professionals.sql
   ✅ Migración ejecutada: 005_create_services.sql
   ✅ Migración ejecutada: 006_create_schedules.sql
   ✅ Migración ejecutada: 007_create_bookings.sql
   ✅ Todas las migraciones completadas
   ✅ Conexión a base de datos establecida
   ✅ Aplicación iniciada correctamente
   ↓
3. Backend corriendo en http://0.0.0.0:8000
```

---

### Documentación Actualizada

**Archivo modificado:** `CLAUDE.md`

Se agregó sección **"Sistema de Migraciones"** completa con:
- Explicación de cómo funciona
- Workflow de despliegue
- Instrucciones para agregar nuevas migraciones
- Confirmación que todas las migraciones son idempotentes

```markdown
## Sistema de Migraciones

**GitHub es la fuente de verdad del schema** — las migraciones SQL se versionan en el repo y se ejecutan automáticamente en startup.

### Cómo funciona:

1. Archivos en `backend/migrations/`: 001_create_users.sql, 002_create_businesses.sql, etc.
   - Se ejecutan en orden (por nombre)

2. Ejecución automática:
   - `migrations/run_migrations.py` corre en evento `startup` de FastAPI
   - Crea tabla `schema_migrations` para trackear ejecutadas
   - Solo ejecuta las que faltan (idempotentes)

3. Workflow:
   git push → Pull en servidor → docker-compose up → migraciones automáticas → app ready

### Para agregar una migración nueva:

1. Crear archivo en backend/migrations/
   Ej: 008_add_column_to_users.sql

2. Escribir SQL (puede tener múltiples statements)
   ALTER TABLE users ADD COLUMN phone TEXT;

3. Hacer git push

4. En servidor: docker-compose up
   Las migraciones corren automáticamente

**Importante:** Todas las migraciones son idempotentes. Pueden correr múltiples veces sin error.
```

---

### Ventajas vs Supabase

| Aspecto | Supabase | PostgreSQL Local |
|--------|---------|------------------|
| **Control** | Sin control del schema | Control total |
| **Versionamiento** | Manual (no hay) | En Git con cada commit |
| **Despliegue** | Manual (con CLI) | Automático en startup |
| **Desarrollo** | Conexiones remotas lentas | Conección local instant |
| **Costo** | Requiere account | Gratuito en local |
| **Escalabilidad** | Requiere upgrade Supabase | Migramos a RDS/CloudSQL después |

---

### Próximos pasos

1. **Testing en servidor:** Subir cambios a GitHub y probar que `docker-compose up` hace todo automáticamente
2. **Página de Disponibilidad:** Interfaz para profesionales definan horarios semanales
3. **Integraciones:** Resend (emails), Mercado Pago (pagos)

---

*Última actualización: 2026-05-14 (Sesión 8 - Migración a PostgreSQL Local)*

---

## Sesión 9: Mejoras UX/UI en Panel Admin — Dos Columnas y Disponibilidad

### Resumen

Se implementaron mejoras visuales consistentes en todas las páginas CRUD del panel administrativo (Servicios, Sucursales, Profesionales, Reservas). Se reemplazó el selector de horarios manual con un componente inteligente que respeta la disponibilidad de profesionales. Todas las páginas comparten ahora un diseño de dos columnas: formulario sticky a la izquierda, listado a la derecha.

### Fase 1: TimeSlotSelector — Selector Inteligente de Horarios

#### Nuevo componente:
**`frontend/src/components/ui/TimeSlotSelector.tsx`**

Reemplaza los campos manuales `starts_at` y `ends_at` con un selector visual inteligente que:

- **Carga disponibilidad:** GET `/api/availability/{professional_id}` + GET `/api/schedule-blocks/{professional_id}`
- **Genera fechas disponibles:** Itera próximos 365 días, filtra solo aquellos con disponibilidad activa
- **Calcula horarios:** Para la fecha seleccionada, genera slots de 30 minutos respetando start_time/end_time
- **Bloqueos manuales:** Marca horarios dentro de schedule_blocks como "✗ Bloqueado" (deshabilitados)
- **Formato visual:** dd/mm/yyyy para fechas, HH:mm para horarios

Dos select dropdowns:
1. Fecha (muestra solo fechas disponibles)
2. Horario turno (muestra solo horarios disponibles, marca bloqueados)

#### Integración en BookingsPage:
- Reemplazó campos manuales `starts_at` y `ends_at` por `<TimeSlotSelector />`
- Agregada función `calculateEndTime(startTime, serviceDurationMinutes)` para calcular hora de fin automáticamente
- Prop `onChange={handleTimeSlotChange}` actualiza formData.starts_at y formData.ends_at

---

### Fase 2: Rediseño de Dos Columnas (Todas las Páginas CRUD)

Patrón aplicado a: **BookingsPage**, **ServicesPage**, **BranchesPage**, **ProfessionalsPage**

#### Layout Grid:
```html
<div className="grid grid-cols-3 gap-6 min-h-screen">
  <!-- Columna Izquierda: Formulario Sticky (col-span-1) -->
  <div className="col-span-1">
    <Card className="sticky top-6">
      {/* Formulario con Reset + Submit */}
    </Card>
  </div>
  
  <!-- Columna Derecha: Listado (col-span-2) -->
  <div className="col-span-2">
    {/* Cards de items o tabla */}
  </div>
</div>
```

**Ventajas:**
- Usuario ve formulario y listado simultáneamente
- Formulario sticky sigue al scroll
- Máxima reutilización de pantalla
- Patrón consistente en toda la app

---

### Fase 3: Estilo y Tipografía

#### Select Elements — Slate Color Scheme
```tailwindcss
border-slate-300
bg-slate-50
hover:bg-slate-100
focus:ring-2 focus:ring-black focus:border-transparent
transition
```

Aplicado a todos los `<select>` (profesional, servicio, sucursal, etc.)

#### Botones de Formulario
- **Reset:** `size="sm" variant="outline"` — posicionado antes de Submit
- **Submit:** `className="flex-1"` — ocupa el espacio disponible

#### Cambio de Terminología
- "Selecciona" → **"Seleccione"** (más formal para usuarios PYMES)

#### Formateo de Fechas
- Cambio de mm/dd/yyyy → **dd/mm/yyyy**
- Implementado con `<select>` dropdown (mejor UX que input nativo)
- Función `formatDateForDisplay(dateStr)`: convierte YYYY-MM-DD a DD/MM/YYYY

---

### Fase 4: Actualización de Páginas Específicas

#### ProfessionalsPage.tsx
- Dos columnas grid
- Formulario: nombre, sucursal (select), bio, avatar_url, checkboxes de servicios
- Reset button antes de submit
- Card de profesional muestra: **avatar (w-16 h-16 rounded-full)**, nombre, sucursal (📍), bio
- Botones: Editar, Eliminar

#### ServicesPage.tsx
- Dos columnas
- Formulario: nombre, duración (min/max 15-480), precio, descripción
- Reset button
- Card muestra: nombre, duración + precio en línea, descripción (si existe)

#### BranchesPage.tsx
- Dos columnas
- Formulario: nombre, dirección (opt), teléfono (opt)
- Reset button
- Card muestra: nombre, dirección, teléfono

#### BookingsPage.tsx
- Dos columnas
- Formulario: profesional, servicio, datos del cliente, **TimeSlotSelector**, teléfono (opt)
- Reset button
- Filtro por estado (confirmed, cancelled, completed, todas)
- Card de reserva: cliente info, profesional/servicio, horario, estado (badge color), monto (si pago)

---

### Características Implementadas

✅ **TimeSlotSelector inteligente:** Carga availability + schedule_blocks en paralelo
✅ **Dos columnas en todas las páginas:** Consistencia visual
✅ **Reset buttons funcionales:** Limpian formulario a estado inicial
✅ **Selects con color slate:** Mejora visual sutil
✅ **Fechas en dd/mm/yyyy:** Mejor UX para usuarios españolhablantes
✅ **Avatares de profesionales:** Mostrados en cards (w-16 h-16 rounded-full)
✅ **Bloques horarios respetados:** Times bloqueados aparecen como "✗ Bloqueado"
✅ **Cálculo automático de fin:** ends_at se calcula según duración del servicio

---

### Problemas Resueltos

#### 1. Avatares no visibles
- **Error:** Campo avatar_url existía en formulario pero no se mostraba en cards
- **Fix:** Agregada renderización `<img src={prof.avatar_url} ... />` en card
- **Estilo:** w-16 h-16 rounded-full object-cover flex-shrink-0

#### 2. Formato de fecha (mm/dd/yyyy vs dd/mm/yyyy)
- **Error inicial:** Input type="date" nativo usa locale del sistema (typically mm/dd/yyyy)
- **Intento 1:** Input invisible sobre botón (solo edge derecho clickeable)
- **Intento 2:** Input transparente (calendar icon aún visible)
- **Solución final:** `<select>` dropdown con fechas pre-formateadas como "DD/MM/YYYY"
- **Ventaja:** Control total + UX completa

#### 3. React hooks violation en TimeSlotSelector
- **Error:** "Rendered more hooks than during the previous render"
- **Causa:** `useRef` declarado después de `if(isLoading) return`
- **Fix:** Mover todas las hooks declarations al top del componente

#### 4. Selector de horarios bloqueados
- **Implementación:** Método `isTimeBlocked(dateStr, timeStr)` compara rango de schedule_blocks
- **Visualización:** Opción deshabilitada con sufijo " ✗ Bloqueado"

---

### Testing Realizado

✅ Páginas cargan sin errores
✅ Formularios reset funciona correctamente
✅ Selects respetan color slate
✅ Fechas formatean en dd/mm/yyyy
✅ Avatares se muestran en Profesionales
✅ Horarios bloqueados se marcan como no disponibles
✅ Dos columnas responsive en desktop

---

### Próximos Pasos

1. **Página de Disponibilidad:** Interfaz para profesionales definan horarios semanales (aún no hecha)
2. **Testing en navegador:** Verificar rendering de todas las páginas
3. **Integraciones:** Resend (emails), Mercado Pago (pagos)
4. **Reportes:** Dashboard mejorado con gráficos

---

**Resumen de cambios:**
- **Archivos nuevos:** 1 (TimeSlotSelector)
- **Archivos modificados:** 4 (Bookings, Services, Branches, Professionals pages)
- **Líneas de código:** ~800 frontend
- **Componentes mejorados:** Consistency en UI/UX

*Última actualización: 2026-05-14 (Sesión 9 - Mejoras UX/UI + TimeSlotSelector)*

---

## Sesión 10: Design System y Tema Visual Renovado

### Resumen

Se implementó un **sistema de diseño cohesivo y profesional** para toda la plataforma. Se renovaron colores, tipografía y componentes con un enfoque "Modern Professional Refined" que transmite confianza y accesibilidad. La paleta utiliza Indigo como primario y Emerald como acentos, con tipografía característica (Poppins para headers, Lora para body).

### Configuración de Tailwind CSS

**Archivo modificado:** `frontend/tailwind.config.js`

Se agregó una **paleta de colores personalizada:**

#### Primario: Indigo (Profesionalismo y Confianza)
```
primary-50: #f0f4ff
primary-100: #e5ebff
primary-200: #d1ddff
primary-300: #a8c5ff
primary-400: #7ba3ff
primary-500: #5a7cff (default)
primary-600: #4557e8
primary-700: #3b46d4
primary-800: #2d36ad
primary-900: #252d8a
```

#### Acentos: Emerald (Crecimiento y Éxito)
```
accent-50: #f0fdf4
accent-100: #dcfce7
accent-200: #bbf7d0
accent-300: #86efac
accent-400: #4ade80
accent-500: #22c55e (default)
accent-600: #16a34a
accent-700: #15803d
```

#### Neutrales: Grises Sofisticados
```
neutral-50 → neutral-900 (backgrounds, borders, text)
```

#### Semánticos
```
success: #22c55e
warning: #f59e0b
error: #ef4444
info: #3b82f6
```

#### Tipografía
```
display: Poppins (headers, botones, títulos)
body: Lora (párrafos, descripciones)
mono: Fira Code (código, IDs)
```

#### Sombras Personalizadas
```
shadow-sm: sutil (1px)
shadow-md: estándar (4px)
shadow-lg: elevada (10px)
shadow-elevation: primaria con color indigo (20px)
```

#### Animaciones
```
fadeIn: fade in 0.3s
slideIn: slide from left 0.3s
fadeSlideIn: fade + slide from top 0.4s
```

---

### Estilos Globales CSS

**Archivo modificado:** `frontend/src/index.css`

Se agregó un **sistema completo de componentes reutilizables** con clases CSS:

#### Variables CSS Globales
```css
--color-primary: #5a7cff
--color-accent: #22c55e
--color-success: #22c55e
--color-warning: #f59e0b
--color-error: #ef4444
--color-info: #3b82f6
```

#### Componentes Reutilizables
```css
.btn              /* Botones base */
.btn-primary      /* Indigo con sombra */
.btn-secondary    /* Gris claro */
.btn-outline      /* Indigo outline */
.btn-ghost        /* Sin fondo */
.btn-danger       /* Rojo */
.btn-success      /* Verde */

.card             /* Sombra base */
.card-elevated    /* Sombra pronunciada */

.input            /* Inputs con focus ring */
.input-error      /* Error styling */

.badge            /* Badges base */
.badge-primary    /* Indigo */
.badge-success    /* Verde */
.badge-warning    /* Naranja */
.badge-error      /* Rojo */

.nav-link         /* Links de navegación */
.nav-link-active
.nav-link-inactive
```

#### Base Styles
- Headings (h1-h6) con Poppins bold
- Body text con Lora regular
- Scroll behavior smooth
- Tipografía base 16px (body: 1rem)

---

### Componentes Rediseñados

#### Layout Principal

**`frontend/src/components/layout/Layout.tsx`** (modificado)
- Logo con gradiente indigo sutil (fondo azul con checkmark)
- Navbar blanca con sombra elegante
- Botón "Cerrar sesión" con clase .btn-ghost
- Main container con animación fade-in

**`frontend/src/components/layout/Sidebar.tsx`** (modificado)
- Gradiente oscuro profesional (neutral-900 → 800)
- Indicador de página activa con línea verde (accent-500) en el lado izquierdo
- Botones con transiciones suaves (duration-200)
- Colores: indigo para items activos, gris para inactivos
- Footer con versión de la app
- Animaciones staggered en items del menú

#### Componentes UI

**`frontend/src/components/ui/Button.tsx`** (actualizado)
- Variantes: primary, secondary, outline, danger
- Tipografía display (Poppins) semibold
- Sombras mejoradas (shadow-md hover:shadow-lg)
- Transiciones todas a duration-200

**`frontend/src/components/ui/Card.tsx`** (actualizado)
- Uso de clases .card y .card-elevated
- Prop `elevated` para controlar sombra
- Bordes en neutral-200

**`frontend/src/components/ui/Input.tsx`** (actualizado)
- Uso de clase .input base
- Soporte para .input-error
- Tipografía body (Lora)
- Label con display font medium

---

### Guía de Diseño

**Archivo nuevo:** `frontend/src/styles/design-system.md`

Documentación completa que incluye:
- Paleta de colores completa (all variants)
- Tipografía (familias, sizes, usage)
- Componentes reutilizables con ejemplos
- Spacing (gutter, section)
- Border radius
- Sombras
- Animaciones
- Casos de uso específicos
- Notas de accesibilidad

---

### Documentación de Cambios

**Archivo nuevo:** `DESIGN_SYSTEM_UPDATE.md`

Resumen visual de la renovación que incluye:
- ¿Qué cambió?
- Paleta de colores (con ejemplos)
- Tipografía
- Componentes rediseñados
- Características de diseño
- Archivos modificados
- Próximos pasos

---

### Características del Design System

✅ **Paleta Cohesiva:** Indigo primario + Emerald acentos + Neutrales sofisticados
✅ **Tipografía Característica:** Poppins (display) + Lora (body) crean personalidad
✅ **Componentes Reutilizables:** Clases .btn*, .card, .input, .badge listas para usar
✅ **Micro-interacciones:** Transiciones suaves y hover states intuitivos
✅ **Accesibilidad:** Contraste adecuado, tamaños legibles, focus rings
✅ **Responsive:** Todos los componentes adaptan a mobile
✅ **Variables CSS:** Fácil mantenimiento y personalización futura
✅ **Animaciones:** Fade-in, slide-in, fade-slide-in

---

### Decisiones de Diseño

**Indigo vs Purple:**
- Indigo transmite más profesionalismo que purple
- Mejor contraste en backgrounds claros
- Asociado con tecnología confiable

**Lora para body:**
- Serif elegante y legible en pantalla
- Mejora la percepción de "calidad" vs sans-serif genérico
- Poppins (sans) + Lora (serif) crean contraste visual interesante

**Emerald para acentos:**
- Verde representa crecimiento y éxito
- Complemento natural del indigo
- Usado para badges positivos, confirmaciones

**Sidebar con gradiente:**
- Suaviza la sensación de "barra oscura pesada"
- Gradiente neutral (no color) mantiene profesionalismo
- Indicador verde en activo (accent-500) es sutil pero claro

---

### Próximos Pasos

1. **Testing en navegador:** Verificar que todas las páginas heredan correctamente los estilos
2. **Aplicar a nuevas páginas:** Las páginas nuevas deben usar las clases del design system
3. **Temas oscuros (opcional):** Usar CSS variables para crear dark mode en el futuro
4. **Componentes adicionales:** Modales, tooltips, notifications siguiendo el sistema

---

**Resumen de cambios:**
- **Archivos nuevos:** 2 (design-system.md, DESIGN_SYSTEM_UPDATE.md)
- **Archivos modificados:** 8 (tailwind.config.js, index.css, Layout.tsx, Sidebar.tsx, Button.tsx, Card.tsx, Input.tsx, types)
- **Líneas de código:** ~500 CSS + ~100 componentes
- **Colores personalizados:** 4 paletas principales + semánticos
- **Clases reutilizables:** 20+ componentes

*Última actualización: 2026-05-15 (Sesión 10 - Design System Renovado)*
