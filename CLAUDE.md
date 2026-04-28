# CLAUDE.md — Sistema de Turnos y Reservas

## Qué es este proyecto

Plataforma SaaS de agendamiento para negocios que necesitan gestionar citas, turnos o reservas (peluquerías, médicos, gimnasios, talleres, consultoras, spas). Los clientes se registran, pagan y completan onboarding autónomo de 5 pasos sin intervención humana.

## Stack

- **Backend:** Python 3.11 + FastAPI
- **Frontend Panel:** React + Vite + Tailwind CSS (pendiente de implementar)
- **Widget Reservas:** HTML + CSS + JS vanilla embebible (pendiente)
- **DB:** PostgreSQL (Supabase)
- **Email:** Resend (default) o SMTP configurable
- **Pagos:** Mercado Pago (plugin)
- **Deploy:** AWS (pendiente)

## Estructura de carpetas

```
backend/
├── main.py                  # Punto de entrada
├── config/settings.py       # Configuración y variables de entorno
├── routers/                 # Endpoints (sin lógica de negocio)
├── controllers/             # Orquestación de flujo
├── services/                # Lógica de negocio
├── repositories/            # Acceso a base de datos
├── integrations/            # Servicios externos (Resend, MP, Google Calendar)
├── schemas/                 # Modelos Pydantic
├── middleware/              # Auth, errores, logging
├── utils/                   # Utilidades (logger, db, errors)
└── migrations/              # Migraciones SQL versionadas
```

## Convenciones de código

- **Arquitectura por capas:** router → controller → service → repository → DB
- **Errores:** siempre `AppError` con message, code y status_code
- **Logs:** solo eventos de negocio importantes — usar `utils.logger.get_logger()`
- **Límites de archivos:** routers 80 líneas, controllers 100, services 150, repositories 100
- **IDs externos:** siempre como UUID tipado en endpoints
- **Docstrings:** obligatorios en funciones de services e integrations

## Reglas para Claude

- No modificar archivos fuera del scope de la tarea
- Si un archivo supera el límite de líneas, proponer cómo dividirlo antes de escribir
- Seguir las bases de desarrollo en `BASES-DE-DESARROLLO.md`
- Seguridad: seguir `SEGURIDAD-PENTEST.md` (cero secrets en código, validación Pydantic, RLS)
- UX/UI: seguir `UX-UI.md` (usuarios pymes con bajo conocimiento técnico)
- Ante la duda entre dos enfoques, preguntar antes de implementar

## Estado actual del proyecto

### Implementado (v0.2)
- [x] Estructura de carpetas del backend
- [x] Configuración centralizada (settings.py)
- [x] Migraciones de base de datos (7 tablas: users, businesses, branches, professionals, services, availability/schedule_blocks, bookings)
- [x] Middleware de autenticación JWT
- [x] Handler global de errores
- [x] Logger centralizado JSON
- [x] Cliente de base de datos PostgreSQL
- [x] Schemas comunes y respuestas estándar
- [x] **Módulo de autenticación completo:**
  - `schemas/auth.py` — RegisterRequest, LoginRequest, AuthResponse
  - `repositories/user_repo.py` — CRUD de usuarios
  - `services/auth_service.py` — registro, login, hash bcrypt, tokens JWT
  - `controllers/auth_controller.py` — orquestación
  - `routers/auth_router.py` — POST /register, /login, /refresh, GET /me

### Pendiente
- [ ] Módulo de onboarding del negocio (5 pasos)
- [ ] Módulo de onboarding del negocio (5 pasos)
- [ ] CRUD de profesionales, servicios, sucursales
- [ ] Lógica de disponibilidad (availability_service.py)
- [ ] CRUD de reservas (booking_router + booking_service)
- [ ] Integración con Resend (emails transaccionales)
- [ ] Integración con Mercado Pago (webhook de pagos)
- [ ] Integración con Google Calendar
- [ ] Frontend panel admin (React + Vite)
- [ ] Widget público de reservas

## Flujos críticos del negocio

1. **Registro → Pago → Onboarding → Activo:** El negocio se registra, paga en Mercado Pago, completa wizard de 5 pasos y queda operativo sin intervención humana
2. **Reserva del cliente final:** Entra a `reservas.dominio.com/negocio-slug` → selecciona servicio/profesional → reserva con email/teléfono → recibe token de confirmación
3. **Cancelación/reprogramación:** Cliente usa token único para cancelar/reprogramar sin cuenta
4. **Cancelación en masa:** Admin cancela todos los turnos de un profesional en rango de fechas → notifica a todos los clientes

## Deuda técnica conocida

- [ ] Agregar tests críticos (auth, pago, reserva)
- [ ] Configurar Ruff para linting/formatting
- [ ] Agregar rate limiting con slowapi
- [ ] Implementar health check que verifique DB
