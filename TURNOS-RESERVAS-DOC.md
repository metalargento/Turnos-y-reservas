# Sistema de Turnos y Reservas — Documento de Producto
**Agencia · Documento interno · 2026**
*Para uso del equipo de desarrollo — versión 1.0*

---

## 1. Qué es este producto

Sistema de Turnos y Reservas es una plataforma web de agendamiento para negocios que necesitan gestionar citas, turnos o reservas. Aplica a cualquier rubro: peluquerías, médicos, estudios, gimnasios, talleres, consultoras, spas, y más.

El negocio paga, completa el onboarding y queda operativo para recibir reservas de sus clientes — sin intervención del equipo de la agencia.

El sistema es **marca blanca**: el cliente final (el que reserva) ve la marca del negocio, no la nuestra.

---

## 2. Modelo de negocio

| Modalidad | Qué incluye |
|---|---|
| **Suscripción mensual** (mínimo 3 meses) | Acceso completo, sin límite de turnos, todas las funcionalidades base |

### Plugins opcionales (costos a definir)

- **Plugin de cobro:** cobro del turno al momento de reservar vía Mercado Pago
- **Plugin de recordatorio WhatsApp:** recordatorio automático vía WhatsApp Business (requiere que el negocio tenga conexión a Meta)

### Canales de pago

- Mercado Pago (principal)
- Hotmart (para escalar)

---

## 3. Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend del panel admin | React + Vite + Tailwind CSS |
| Frontend del widget de reservas | HTML + CSS + JS vanilla (embebible) |
| Backend | FastAPI (Python) |
| Base de datos | PostgreSQL (Supabase) |
| Email transaccional | Resend (default) o SMTP del cliente (configurable) |
| Pagos | Mercado Pago (plugin) |
| Autenticación | JWT (email + contraseña) |
| Integración de calendario | Google Calendar API (opcional, configurable en onboarding) |

---

## 4. Roles del sistema

| Rol | Quién es | Qué puede hacer |
|---|---|---|
| **Owner** | Dueño del negocio | Todo: configurar el negocio, gestionar profesionales, ver todos los turnos |
| **Profesional** | Empleado del negocio | Ver su propia agenda, bloquear fechas, gestionar sus turnos |
| **Cliente final** | El que reserva | Reservar, cancelar, reprogramar, ver sus turnos |

> El Owner crea las cuentas de sus profesionales desde el panel. Los profesionales no se registran solos.

---

## 5. Arquitectura del sistema

```
Cliente final (reserva)
    ↓
Página de reservas (reservas.dominio.com/negocio-slug)
    ↓
Panel Admin (panel.dominio.com)
    ↓
API FastAPI
    ├── auth_router           → registro, login, tokens, roles
    ├── onboarding_router     → flujo de activación post-pago
    ├── business_router       → configuración del negocio y sucursales
    ├── professional_router   → gestión de profesionales
    ├── service_router        → servicios y duraciones
    ├── schedule_router       → disponibilidad y bloqueos
    ├── booking_router        → creación, cancelación, reprogramación
    ├── notification_router   → configuración de emails
    └── webhook_router        → confirmación de pago (MP / Hotmart)

Servicios externos
    ├── Resend / SMTP          → emails transaccionales
    ├── Mercado Pago           → procesamiento de pagos (plugin)
    └── Google Calendar API    → sincronización de agenda (opcional)
```

### Estructura de carpetas (backend)

```
backend/
├── config/settings.py
├── routers/
│   ├── auth.py
│   ├── onboarding.py
│   ├── business.py
│   ├── professional.py
│   ├── service.py
│   ├── schedule.py
│   ├── booking.py
│   ├── notification.py
│   └── webhooks.py
├── controllers/
│   ├── auth_controller.py
│   ├── booking_controller.py
│   ├── schedule_controller.py
│   └── notification_controller.py
├── services/
│   ├── auth_service.py
│   ├── booking_service.py
│   ├── availability_service.py  ← lógica de disponibilidad de horarios
│   ├── notification_service.py
│   └── payment_service.py
├── repositories/
│   ├── user_repo.py
│   ├── business_repo.py
│   ├── professional_repo.py
│   ├── booking_repo.py
│   └── schedule_repo.py
├── integrations/
│   ├── resend_client.py
│   ├── smtp_client.py
│   ├── mercadopago_client.py
│   └── google_calendar_client.py
├── schemas/
│   ├── auth.py
│   ├── booking.py
│   ├── business.py
│   └── schedule.py
└── migrations/
    ├── 001_create_users.sql
    ├── 002_create_businesses.sql
    ├── 003_create_professionals.sql
    ├── 004_create_services.sql
    ├── 005_create_schedules.sql
    └── 006_create_bookings.sql
```

---

## 6. Base de datos — tablas principales

```sql
-- Usuarios del sistema (owners y profesionales)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('owner', 'professional')) NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Negocios (pueden tener múltiples sucursales)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,     -- ej: "peluqueria-juan" → URL pública
    rubro TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#000000',
    secondary_color TEXT DEFAULT '#FFFFFF',
    plan_status TEXT CHECK (plan_status IN ('active', 'expired', 'cancelled')) DEFAULT 'expired',
    plan_expires_at TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    -- Configuración de email
    email_provider TEXT CHECK (email_provider IN ('resend', 'smtp')) DEFAULT 'resend',
    smtp_host TEXT,
    smtp_port INT,
    smtp_user TEXT,
    smtp_password_encrypted TEXT,
    -- Configuración de Google Calendar
    google_calendar_enabled BOOLEAN DEFAULT FALSE,
    google_calendar_token TEXT,
    -- Configuración de anticipación mínima
    min_advance_hours INT DEFAULT 1,   -- horas mínimas de anticipación para reservar
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sucursales de un negocio
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profesionales (empleados del negocio)
CREATE TABLE professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    business_id UUID REFERENCES businesses(id),
    branch_id UUID REFERENCES branches(id),
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servicios que ofrece el negocio
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,   -- duración variable por servicio
    price DECIMAL(10,2),             -- null si no tiene cobro online
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relación profesional ↔ servicios que puede realizar
CREATE TABLE professional_services (
    professional_id UUID REFERENCES professionals(id),
    service_id UUID REFERENCES services(id),
    PRIMARY KEY (professional_id, service_id)
);

-- Disponibilidad semanal del profesional (horarios regulares)
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES professionals(id),
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Domingo, 1=Lunes...
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Bloqueos de fechas del profesional (feriados, vacaciones, ausencias)
CREATE TABLE schedule_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES professionals(id),
    blocked_from TIMESTAMPTZ NOT NULL,
    blocked_until TIMESTAMPTZ NOT NULL,
    reason TEXT,                     -- visible solo para el admin
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservas
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id),
    branch_id UUID REFERENCES branches(id),
    professional_id UUID REFERENCES professionals(id),
    service_id UUID REFERENCES services(id),
    -- Datos del cliente final (sin registro)
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    client_notes TEXT,
    -- Tiempo
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    -- Estado
    status TEXT CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed')) DEFAULT 'confirmed',
    cancelled_by TEXT CHECK (cancelled_by IN ('client', 'professional', 'admin')),
    cancellation_reason TEXT,
    -- Pago (plugin)
    payment_required BOOLEAN DEFAULT FALSE,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    payment_amount DECIMAL(10,2),
    -- Tracking
    confirmation_token TEXT UNIQUE,   -- token para que el cliente pueda cancelar/reprogramar
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Flujo completo del negocio (Owner)

### 7.1 Registro y pago

```
1. El negocio entra a la landing de venta
2. Se registra con email + contraseña (rol: owner)
3. Es redirigido a Mercado Pago para pagar
4. MP confirma el pago → webhook activa el plan
5. El owner recibe mail de bienvenida con link al panel
```

### 7.2 Onboarding del negocio (wizard de 5 pasos)

**Paso 1 — Tu negocio**
- Nombre del negocio *
- Rubro *
- Descripción corta

**Paso 2 — Tu marca**
- Logo (subir imagen)
- Color primario (color picker)
- Color secundario (color picker)

**Paso 3 — Tu primera sucursal**
- Nombre de la sucursal (ej: "Casa central", "Sucursal Norte")
- Dirección
- Teléfono de contacto

**Paso 4 — Tus servicios**
- Agregar servicios: nombre + duración en minutos + precio (opcional)
- Mínimo 1 servicio obligatorio
- Sin límite de servicios

**Paso 5 — Configuración de agenda**
- Anticipación mínima para reservar (ej: "no se puede reservar para dentro de menos de 2 horas")
- Proveedor de email: Resend (default) o SMTP propio
- Integración con Google Calendar (activar / no activar)

Al terminar → panel disponible y página de reservas activa.

> Los profesionales se agregan después del onboarding desde el panel.

---

## 8. Flujo completo del cliente final (reserva)

```
1. El cliente entra a la URL pública del negocio
   (reservas.dominio.com/peluqueria-juan)
2. Ve la marca del negocio (logo, colores) — no la marca de la agencia
3. Selecciona sucursal (si hay más de una)
4. Selecciona servicio
5. Selecciona profesional (o "Sin preferencia" → asignación automática)
6. Ve el calendario con días disponibles
7. Selecciona horario disponible
8. Completa sus datos: nombre, email, teléfono, notas opcionales
9. Si el plugin de cobro está activo → completa el pago en MP
10. Recibe mail de confirmación con:
    - Datos del turno
    - Link para cancelar (válido con token único)
    - Link para reprogramar (válido con token único)
```

---

## 9. Panel del negocio (Owner) — secciones

### Dashboard
- Próximos turnos del día (vista rápida)
- Alertas: turnos sin confirmar, cancelaciones recientes
- Accesos rápidos: agregar bloqueo, ver agenda completa

### Agenda
- Vista de **calendario mensual** con turnos por color según profesional
- Vista de **lista** filtrable por profesional, sucursal, fecha, estado
- Botón para cancelación en masa de un profesional en un día

### Turnos
- Tabla completa con filtros (profesional, sucursal, servicio, estado, fecha)
- Click en turno → detalle completo + acciones (cancelar, marcar completado)
- Cancelación en masa: seleccionar profesional + rango de fechas → cancelar todos + notificar

### Profesionales
- Agregar profesional (nombre, email, avatar)
- Asignar a sucursal
- Asignar servicios que puede realizar
- Ver agenda individual del profesional
- Activar / desactivar profesional

### Servicios
- Agregar, editar, desactivar servicios
- Nombre, duración, precio

### Sucursales
- Agregar, editar, desactivar sucursales
- Cada sucursal con su propio nombre, dirección, teléfono

### Configuración del negocio
- Datos generales (nombre, logo, colores)
- Email transaccional (Resend o SMTP propio)
- Integración Google Calendar
- Anticipación mínima de reserva
- Plantillas de email (personalizar el texto de los mails automáticos)

---

## 10. Panel del profesional — secciones

Panel más simple, solo lo que necesita el profesional:

### Mi agenda
- Vista de calendario con sus turnos
- Vista de lista del día / semana

### Mis bloqueos
- Ver bloqueos activos
- Agregar nuevo bloqueo (fecha/hora desde → hasta, motivo)
- Cancelar bloqueo existente

---

## 11. Vista del cliente final — "Mis turnos"

El cliente final no tiene cuenta, pero puede ver y gestionar sus turnos mediante el **token de confirmación** que recibe en el mail.

```
URL: reservas.dominio.com/mis-turnos?token=XXXXXXXX

Muestra:
- Turno próximo (si tiene)
- Historial de turnos anteriores
- Botón "Cancelar turno" (disponible hasta X horas antes, configurable)
- Botón "Reprogramar turno" (elige nueva fecha/hora)
```

---

## 12. Lógica de disponibilidad

Esta es la parte más crítica del sistema. El `availability_service.py` tiene que:

```python
async def get_available_slots(
    professional_id: UUID,
    service_id: UUID,
    date: date
) -> list[TimeSlot]:
    """
    Calcula los horarios disponibles para un profesional en una fecha.

    Considera:
    1. Disponibilidad semanal del profesional (horarios regulares)
    2. Bloqueos manuales del profesional en ese día
    3. Turnos ya reservados (incluyendo duración del servicio)
    4. Anticipación mínima configurada por el negocio
    5. Que el slot no quede en el pasado

    Returns:
        Lista de slots disponibles con hora de inicio.
    """
```

**Ejemplo de cálculo:**
- Profesional disponible: 9:00 a 18:00
- Servicio dura 45 minutos
- Slots cada 30 minutos: 9:00, 9:30, 10:00...
- Turno reservado de 10:00 a 10:45 → 10:00 y 10:30 no disponibles
- Anticipación mínima: 2 horas → si son las 9:30, el slot de las 11:00 es el primero disponible

---

## 13. Cancelación en masa por parte del admin

```
1. Admin va a la sección "Turnos"
2. Filtra por profesional y rango de fechas
3. Selecciona "Cancelar todos los turnos del período"
4. El sistema pide confirmación con el número de turnos afectados
5. Al confirmar:
   - Todos los turnos cambian a status: 'cancelled'
   - Se envía mail a cada cliente afectado con la notificación
   - Se envía mail al profesional confirmando la cancelación
   - Si había pagos pendientes → se registra como pendiente de reembolso
```

---

## 14. Emails transaccionales del sistema

| Evento | Destinatario | Contenido |
|---|---|---|
| Registro del negocio | Owner | Bienvenida + link al panel |
| Pago confirmado | Owner | Plan activado + link al onboarding |
| Nueva reserva | Cliente final | Confirmación + link para cancelar/reprogramar |
| Nueva reserva | Profesional | Notificación de nuevo turno |
| Cancelación por cliente | Owner + Profesional | Quién canceló, datos del turno |
| Cancelación por admin/profesional | Cliente final | Turno cancelado + disculpas |
| Cancelación en masa | Cada cliente afectado | Turno cancelado + datos |
| Recordatorio de turno | Cliente final | 24hs antes del turno |
| Plan por vencer (3 días) | Owner | Recordatorio de renovación |
| Plan vencido | Owner | Servicio suspendido, opciones de reactivar |

> Los templates de los mails son editables por el owner desde el panel de configuración.
> Solo el texto es editable — la estructura y los datos del turno son fijos.

---

## 15. Integración con Google Calendar

Cuando el owner activa esta integración en el onboarding o configuración:

```
1. Se inicia el flujo OAuth de Google
2. El negocio autoriza el acceso a su Google Calendar
3. El token se guarda encriptado en la tabla businesses
4. Cada nueva reserva confirmada → se crea automáticamente un evento en Google Calendar
5. Cada cancelación → se elimina el evento de Google Calendar
6. El profesional puede ver sus turnos directamente en su Google Calendar
```

---

## 16. Configuración de email (Resend vs SMTP propio)

### Resend (default)
- Los mails salen desde `turnos@dominio-agencia.com`
- Sin configuración extra por parte del cliente
- El cliente no puede cambiar el remitente

### SMTP propio del cliente
- El cliente configura en el panel: host, puerto, usuario, contraseña
- Los mails salen desde el mail del negocio (ej: `hola@peluqueria-juan.com`)
- La contraseña SMTP se guarda encriptada en la base de datos
- Se ofrece este modo para clientes que quieran mails con su propia marca de correo

---

## 17. Marca blanca — personalización visual

El cliente final solo ve la marca del negocio. La agencia no aparece.

**Qué se personaliza:**
- Logo del negocio (aparece en la página de reservas y en los mails)
- Color primario y secundario (botones, headers, acentos)
- Nombre del negocio en el título del browser
- Dominio sugerido (la URL pública usa el slug del negocio)

**Lo que no se personaliza (v1):**
- Tipografía (una tipografía genérica para todos)
- Estructura y layout de la página de reservas
- Estructura de los mails (solo el texto)

---

## 18. Seguridad — reglas para este producto

- JWT para autenticación de owners y profesionales
- El cliente final NO se autentica — usa tokens únicos por turno
- Verificación de ownership: el owner solo ve datos de su negocio
- El profesional solo ve su propia agenda, no la de otros
- Rate limiting en el endpoint de creación de reservas: 10/minuto por IP
- Los tokens de cancelación/reprogramación expiran junto con el turno
- La contraseña SMTP se guarda encriptada, nunca en texto plano
- El token de Google Calendar se guarda encriptado

---

## 19. Lo que NO incluye este producto (scope v1)

- ❌ App móvil nativa
- ❌ Mensajes por WhatsApp (plugin futuro)
- ❌ Reportes y estadísticas del negocio
- ❌ Widget embebible en web externa (v1 es página standalone)
- ❌ Múltiples formas de pago (solo MP en el plugin)
- ❌ Recordatorios por SMS
- ❌ Sistema de listas de espera
- ❌ Reseñas o ratings post-turno
- ❌ Integración con otros calendarios (solo Google Calendar)
- ❌ App para el profesional (solo panel web responsive)

---

## 20. Definición de "done" — cuándo está listo para producción

```
[ ] El negocio puede registrarse, pagar y completar el onboarding sin intervención del equipo
[ ] La página de reservas es funcional y responsive desde el primer turno configurado
[ ] El cliente final puede reservar, cancelar y reprogramar sin crear cuenta
[ ] El owner puede ver su agenda en vista calendario y lista
[ ] El profesional puede bloquear fechas desde su panel
[ ] La cancelación en masa funciona y notifica a todos los clientes afectados
[ ] Los mails salen correctamente con Resend y con SMTP propio
[ ] La integración con Google Calendar crea y elimina eventos correctamente
[ ] La lógica de disponibilidad es correcta: no ofrece horarios ocupados ni bloqueados
[ ] La marca blanca funciona correctamente (logo y colores del negocio)
[ ] El plan se suspende automáticamente al vencer sin pago
[ ] Todos los emails transaccionales se envían correctamente
[ ] Responsive verificado en mobile (375px), tablet (768px) y desktop (1280px)
[ ] Tests de flujos críticos pasando: registro, pago, reserva, cancelación
[ ] pip-audit y npm audit sin vulnerabilidades high/critical
```

---

*Agencia · Sistema de Turnos y Reservas v1.0 · 2026*
