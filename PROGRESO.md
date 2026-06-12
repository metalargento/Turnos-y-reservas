# Progreso del Desarrollo — Sistema de Turnos y Reservas

**Última actualización:** 2026-06-11 (Sesión 24)  
**Estado:** ✅ PRODUCTION READY (Render + Vercel) | Onboarding Fixed | Client Page Improved

---

## Sesión 1: Estructura Base + Autenticación + Onboarding

### Resumen
Construcción de la arquitectura fundamental del proyecto: estructura por capas del backend, sistema de autenticación JWT, sistema automático de migraciones, y el módulo de onboarding de 5 pasos.

### Lo que se hizo
- Estructura carpetas del backend (config, routers, controllers, services, repositories, schemas, middleware, utils, migrations)
- Configuración centralizada (settings.py con variables de entorno)
- Sistema automático de migraciones SQL (GitHub es fuente de verdad)
- Middleware de autenticación JWT con rutas públicas explícitas
- Handler global de errores tipados (AppError)
- Logger centralizado en JSON
- Cliente PostgreSQL reutilizable (RealDictCursor)
- **Módulo de autenticación completo:**
  - RegisterRequest, LoginRequest, AuthResponse schemas
  - CRUD de usuarios con bcrypt hash
  - JWT tokens (access + refresh)
  - Endpoints: POST /register, /login, /refresh, GET /me
- **Módulo de onboarding (5 pasos):**
  - Paso 1: Crear negocio + generar slug único
  - Paso 2: Actualizar marca (logo, colores)
  - Paso 3: Crear primera sucursal
  - Paso 4: Crear servicios
  - Paso 5: Configurar agenda + marcar completado
- **7 migraciones SQL:**
  - users, businesses, branches, professionals, services, availability, bookings

### Próximos pasos
- Módulo de profesionales
- Módulo de disponibilidad
- Módulo de reservas público
- Integraciones (email, pagos)

---

## Sesión 2: Revisión y Estado del Proyecto

### Resumen
Validación que el módulo de onboarding está 100% funcional y listo. Documentación de decisiones de arquitectura.

### Lo que se hizo
- Verificación de compilación sin errores
- Confirmación de arquitectura por capas correcta
- Validaciones de seguridad en su lugar (ownership checks, JWT required)
- Documentación en CLAUDE.md

### Próximos pasos
- Continuar con profesionales, disponibilidad, o reservas

---

## Sesión 3: Panel Admin Frontend + CRUD Backend

### Resumen
Implementación del panel administrativo funcional con navegación lateral, páginas CRUD para servicios y sucursales, y endpoints del backend correspondientes.

### Lo que se hizo
- **Frontend:**
  - Componente Sidebar con navegación (colores indigo/gris)
  - Páginas CRUD: ServicesPage, BranchesPage, SettingsPage
  - Layout de dos columnas (formulario a la izquierda, listado a la derecha)
  - Colores slate para selects, botones de reset funcionando
- **Backend:**
  - Endpoints CRUD para Servicios (GET, POST, PUT, DELETE)
  - Endpoints CRUD para Sucursales (GET, POST, PUT, DELETE)
  - Verificación de ownership en todos los endpoints
- **Tipos:**
  - ServiceCreateRequest, ServiceUpdateRequest
  - BranchCreateRequest, BranchUpdateRequest

### Próximos pasos
- Módulo de profesionales
- Disponibilidad
- Reservas

---

## Sesión 4: Módulo de Profesionales (Completo)

### Resumen
CRUD completo de profesionales con asignación de servicios. Incluyó backend, frontend, y lógica de relaciones muchos-a-muchos.

### Lo que se hizo
- **Backend:**
  - Repository con métodos: create, find_by_id, find_by_business_id, update, deactivate, assign_services, get_services
  - Controllers y routers con 5 endpoints
  - Verificación de ownership
- **Frontend:**
  - ProfessionalsPage con formulario y listado
  - Checkboxes para asignar múltiples servicios
  - Avatares en tarjetas (w-16 h-16 rounded-full)
  - Editar/desactivar funcional

### Próximos pasos
- Disponibilidad (horarios semanales y bloqueos)
- Reservas

---

## Sesión 5: Availability Module - Disponibilidad de Profesionales

### Resumen
Módulo completo permitiendo que profesionales definan horarios regulares semanales y bloqueos manuales (vacaciones, feriados).

### Lo que se hizo
- **Backend:**
  - Endpoints GET/POST/PUT para availability (horarios semanales)
  - Endpoints GET/POST/DELETE para schedule_blocks (bloqueos)
  - Prevención de duplicados en horarios semanales
  - Validaciones de fecha y hora
- **Frontend:**
  - AvailabilityPage con selector de profesional
  - Tab de horarios: lunes-domingo con hora inicio/fin
  - Tab de bloqueos: calendario con rango de fechas
  - Modal para crear/editar horarios
  - Prevención de conflictos horarios

### Próximos pasos
- Reservas públicas del cliente
- Integraciones de email

---

## Sesión 6: Widget Público de Reservas (Parte 1)

### Resumen
Implementación del flujo de cancelación simplificado. Clientes pueden agendar turos sin crear cuenta, y cancelar usando solo email + nombre.

### Lo que se hizo
- **Backend:**
  - Endpoint POST /cancel para cancelación por email + nombre
  - Validación case-insensitive
  - Error handling (401, 404, 409)
- **Frontend:**
  - Página PublicCancelPage nueva
  - Flujo: formulario → enviando → éxito/error
  - Redirección automática después de éxito
- **Cambios en confirmación:**
  - Removido: mostrar código/token
  - Agregado: mensaje con link a `/cancel/{slug}`

### Próximos pasos
- Integración de emails
- Dashboard con estadísticas
- Portal de cliente completo

---

## Sesión 7: Dashboard Funcional con Estadísticas

### Resumen
Dashboard interactivo mostrando en tiempo real: reservas por período, cancelaciones, clientes únicos, próximos turnos con tarjetas coloreadas.

### Lo que se hizo
- **Backend:**
  - Dashboard repository con métodos: get_stats, get_upcoming_bookings
  - Queries SQL eficientes con FILTER clauses
  - Endpoint GET /api/dashboard/{business_id}
- **Frontend:**
  - DashboardPage reescrito con 5 tarjetas de estadísticas
  - Colores temáticos (azul, verde, púrpura, rojo, naranja)
  - Sección próximas reservas (linked join con professionals/services)
  - Sección acciones rápidas (botones a módulos)
  - Estados: loading, error, datos

### Próximos pasos
- Portal de cliente
- Integraciones email
- Deployment

---

## Sesión 8: Migración a PostgreSQL Local + Sistema Automático de Migraciones

### Resumen
Migración de Supabase a PostgreSQL en Docker. Implementado sistema donde GitHub es fuente de verdad — migraciones SQL se ejecutan automáticamente en startup de FastAPI.

### Lo que se hizo
- **Infraestructura:**
  - Docker Compose con PostgreSQL 16 en puerto 5433
  - `.env` apuntando a `localhost:5433`
- **Sistema de migraciones:**
  - `run_migrations.py` ejecuta en evento startup de FastAPI
  - Tabla `schema_migrations` trackea ejecutadas
  - Idempotente: múltiples ejecuciones seguras
  - Cierra la app si hay error en migración
- **Documentación:**
  - Sección en CLAUDE.md explicando workflow

### Próximos pasos
- Página de Disponibilidad (interfaz mejorada)
- Integraciones email
- Deployment a Vercel + Render

---

## Sesión 9: Mejoras UX/UI — Dos Columnas + TimeSlotSelector

### Resumen
Rediseño consistente de todas las páginas CRUD con layout de dos columnas. Nuevo componente TimeSlotSelector que genera horarios respetando disponibilidad y bloqueos.

### Lo que se hizo
- **Componente TimeSlotSelector:**
  - Carga availability + schedule_blocks en paralelo
  - Genera fechas disponibles (próximos 365 días)
  - Calcula slots de 30 minutos respetando horarios
  - Marca bloques como "✗ Bloqueado"
  - Formato dd/mm/yyyy para fechas
- **Layout unificado:**
  - Dos columnas: formulario sticky (col-span-1), listado (col-span-2)
  - Patrón en todas las páginas CRUD
  - Buttons reset + submit funcional
- **Estilos mejorados:**
  - Selects con color slate
  - Avatares en profesionales (w-16 h-16 rounded-full)
  - Fechas en dd/mm/yyyy

### Próximos pasos
- Design System visual
- Integraciones email
- Deployment

---

## Sesión 10: Design System + Tema Visual Renovado

### Resumen
Implementación de sistema de diseño cohesivo y profesional. Paleta Indigo primario + Emerald acentos, tipografía Poppins + Lora, componentes reutilizables.

### Lo que se hizo
- **Tailwind config:**
  - Paleta personalizada: Indigo (confianza), Emerald (éxito), Neutrales sofisticados
  - Colores semánticos (success, warning, error, info)
- **Estilos globales CSS:**
  - Variables CSS globales
  - Clases reutilizables: .btn*, .card, .input, .badge, .nav-link
  - Tipografía: h1-h6 con Poppins, body con Lora
  - Animaciones: fadeIn, slideIn, fadeSlideIn
- **Componentes actualizados:**
  - Layout con logo + gradiente
  - Sidebar con indicador verde en activo
  - Button con variantes y sombras
  - Card con prop `elevated`
  - Input con .input-error
- **Documentación:**
  - `design-system.md` con paleta completa
  - `DESIGN_SYSTEM_UPDATE.md` con resumen visual

### Próximos pasos
- Email integration
- Disponibilidad mejorada
- Deployment

---

## Sesión 11: Dashboard Interactivo + Portal de Cliente

### Resumen
Dashboard con tarjetas clickeables actualizando panel dinámico. Portal de cliente sin login donde pueden ver y cancelar reservas con email + teléfono.

### Lo que se hizo
- **Dashboard mejorado:**
  - Tarjetas clickeables (state selectedTab)
  - Panel dinámico mostrando: hoy, semana, mes, canceladas, clientes
  - Métodos nuevos en dashboard_repo para cada período
- **Portal ClientBookingsPage:**
  - Query params: email + phone
  - Mascara email/teléfono parcialmente
  - 3 tabs: Próximas, Historial, Canceladas
  - Botón cancelar funcional
  - Empty states y error handling

### Próximos pasos
- Migración a Supabase
- Integraciones email
- Deployment

---

## Sesión 12: Migración a Supabase + Full Stack Ready

### Resumen
Migración de BD local a Supabase cloud. Backend conectado a PostgreSQL en la nube. Sistema de migraciones ajustado para Supabase Pooling. End-to-end testing completado.

### Lo que se hizo
- **Base de datos:**
  - Migración a Supabase (aws-1-us-east-1.pooler.supabase.com:6543)
  - Pooling mode (Transaction mode, máxima estabilidad)
- **Migraciones SQL:**
  - Agregado `SET search_path TO public;` para Supabase
  - Todas las 7 migraciones ejecutadas manually en Supabase SQL Editor
- **Datos de prueba:**
  - Usuario owner
  - Negocio "Consultorio Chapatin"
  - Rama, profesional, servicio, disponibilidad
- **Verificación:**
  - Widget público funciona desde Supabase
  - Reserva de prueba exitosa
  - Portal de cliente funcional

### Próximos pasos
- Email integration
- Deployment (Railway, Render, Fly.io)

---

## Sesión 13: Dark Mode Refinement + Profesionales Services Persistence

### Resumen
Refinación completa del dark mode en toda la interfaz. Bug crítico resuelto: servicios asignados a profesionales ahora se guardan y cargan correctamente.

### Lo que se hizo
- **Dark Mode:**
  - Input labels: mejorado contraste
  - Services page: colores oscuros para texto
  - Professionals page: selects con dark mode, checkboxes normalizados
  - TimeSlotSelector: selects oscuros completamente funcionales
- **Professional Services Persistence:**
  - Backend: LEFT JOIN + json_agg para devolver service_ids en queries
  - Frontend: `handleEdit()` carga servicios del profesional
  - Bug fix: checkboxes ahora muestran servicios asignados

### Próximos pasos
- Dark mode en todas las páginas (bookings, branches, settings)
- Email integration
- Deployment

---

## Sesión 14: Dark Mode Completo — Todas las Páginas

### Resumen
Completado dark mode en las 4 páginas principales restantes (Dashboard, Bookings, Branches, Settings) con patrón consistente de colores.

### Lo que se hizo
- **DashboardPage:**
  - Títulos: neutral-100, labels: neutral-400
  - Cards de clientes con dark backgrounds
  - Empty states y acciones rápidas con colores oscuros
- **BookingsPage:**
  - Nombres de clientes: neutral-100
  - Emails/teléfonos: neutral-400
  - Profesional/servicio con dark support
  - Fecha/hora con fondo oscuro para contraste
- **BranchesPage:**
  - Títulos: neutral-100, detalles: neutral-400
  - Nombres de sucursales claros en dark
- **SettingsPage:**
  - 4 secciones (negocio, marca, agenda, plan)
  - Inputs con backgrounds oscuros
  - SMTP config: colores azules ajustados
  - Preview de colores: bordes oscuros
- **Patrón consistente:**
  - Títulos principales: neutral-100
  - Labels: neutral-200
  - Textos terciarios: neutral-400
  - Inputs: neutral-800 backgrounds

### Próximos pasos
- Email integration
- Deployment
- Integraciones (pagos, Google Calendar)

---

## Sesión 15: Availability Module — Horarios Semanales y Bloqueos

### Resumen
Módulo completo de disponibilidad permitiendo profesionales definir horarios regulares semanales y bloqueos manuales.

### Lo que se hizo
- **Backend endpoints:**
  - GET/POST/PUT para availability (horarios semanales)
  - GET/POST/DELETE para schedule_blocks (bloqueos por fecha)
  - Validaciones de conflictos y rangos horarios
- **Frontend AvailabilityPage:**
  - Selector de profesional
  - Tab: Horarios semanales (lunes-domingo)
  - Tab: Bloqueos (calendario con rango)
  - Modal para crear/editar
  - Visual feedback y error handling
- **Features:**
  - Prevención de duplicados en horarios
  - Marcado de bloques en TimeSlotSelector
  - Respeto de availability en reservas públicas

### Próximos pasos
- Email integration (confirmaciones, cancelaciones)
- Deployment

---

## Sesión 16: Email Integration — Confirmaciones y Cancelaciones

### Resumen
Integración completa con Resend para envío automático de emails transaccionales en confirmación y cancelación de reservas.

### Lo que se hizo
- **Backend integrations/resend_service.py:**
  - `send_booking_confirmation()`: HTML templated email
  - `send_booking_cancellation()`: notificación de cancelación
  - `send_reminder_email()`: estructura preparada para recordatorios
  - Fallback a SMTP si Resend no configurado
- **Hooks en booking lifecycle:**
  - POST /book triggers confirmación
  - POST /cancel triggers cancelación
  - Manejo de errores sin bloquear reserva
- **Testing:**
  - Verificado con Gmail y Hotmail
  - HTML templates con info de cita

### Próximos pasos
- Deployment
- Integraciones pagos
- Google Calendar sync

---

## Sesión 17: SMTP Debugging & Email Improvements

### Resumen
Investigación profunda en autenticación SMTP. Identificado bug en password SMTP y limitaciones de Gmail. Pivotado a Resend como servicio principal.

### Lo que se hizo
- **Debugging:**
  - Identificado: Gmail requiere contraseña de aplicación, no password normal
  - Identificado: Bug en business_repo con encriptación de SMTP password
  - Investigado: Resend es más confiable que SMTP para producción
- **Decisión:**
  - Resend como servicio principal
  - SMTP como fallback
  - Mejor UX y menos problemas de configuración

### Próximos pasos
- Deployment (Railway, Render, Fly.io)

---

## Sesión 18: Deployment — Railway + Vercel

### Resumen
Deployment exitoso del MVP en producción. Backend en Railway, frontend en Vercel, BD en Supabase.

### Lo que se hizo
- **Backend (Railway):**
  - Creación `start.sh` para buildpack detection
  - Variables de entorno configuradas
  - Deployment en https://turnos-y-reservas-production.up.railway.app
- **Frontend (Vercel):**
  - Deploy automático en https://turnos-y-reservas-4qy2.vercel.app
  - TypeScript errors corregidos
  - CORS configurado
- **Database:**
  - Supabase ya en producción
  - Datos de prueba listos
- **Bloqueador:**
  - Railway free trial expiró → requiere pago ($5/mes)

### Próximos pasos
- Migración a plataforma gratuita (Fly.io, Render)

---

## Sesión 19: Migración a Fly.io Free Tier

### Resumen
Migración del backend de Railway a Fly.io para evitar pago. Deploy inicial exitoso.

### Lo que se hizo
- **Fly.io setup:**
  - Creación de app (chia-seasoning-4508)
  - Configuración de secrets y variables
  - Dockerfile creado
  - Deploy inicial completado
- **Status:**
  - Backend esperando verificación de health

### Próximos pasos
- Verificar health en producción
- Testing end-to-end

---

## Sesión 20: Fly.io Fixes & Vercel Deployment

### Resumen
Fix de restart loop en Fly.io. Backend ahora operativo y comunicando con frontend de Vercel.

### Lo que se hizo
- **Fly.io fixes:**
  - Problema: start.sh no era ejecutable
  - Solución: uvicorn directo en Procfile
  - Instalación: email-validator package
  - Backend ahora online en Fly.io
- **Frontend:**
  - Operativo en Vercel
  - Comunicando con backend correctamente

### Próximos pasos
- CORS final setup
- Testing end-to-end

---

## Sesión 21: CORS Fixes en Fly.io

### Resumen
Resolución de problemas de routing. Frontend en Vercel no podía comunicarse con backend en Fly.io.

### Lo que se hizo
- **Problema identificado:**
  - Variable de entorno RENDER_URL inco rrecta
  - Frontend usando URL equivocada
- **Fix:**
  - Actualización de publicClient configuration
  - Verificación de CORS headers
  - Vercel frontend ahora comunica correctamente con Fly.io

### Próximos pasos
- Testing completo
- Deployment a plataforma mejor

---

## Sesión 22: Migración a Render + Vercel (PRODUCTION READY)

### Resumen
Migración final de Fly.io a Render. Backend + frontend ahora en producción con mejor performance.

### Lo que se hizo
- **Backend (Render):**
  - Migración de Fly.io a Render
  - URL: https://turnos-y-reservas.onrender.com
  - Configuración CORS finalizada
- **Frontend:**
  - URL: https://turnos-y-reservas-4qy2.vercel.app
  - Auto-deploy en git push
- **Testing:**
  - ✅ End-to-end completo
  - ✅ Login funcional
  - ✅ Booking flow funcional
  - ✅ Email confirmations funcional
  - ✅ Portal cliente operativo
  - ✅ Dashboard con stats

### Próximos pasos
- Image upload
- Integraciones avanzadas

---

## Sesión 23: Image Upload & CORS Middleware Fixes

### Resumen
Implementación de upload de imágenes a Supabase Storage. Correcciones críticas en CORS middleware para error responses.

### Lo que se hizo
- **Backend:**
  - Creación `upload_router.py` con endpoints `/api/upload/logo` y `/api/upload/avatar`
  - Integración con Supabase Storage
  - Fix: FormData parsing correcto (cambio a Form())
  - Fix: CORS headers en auth_middleware para error responses
- **Frontend:**
  - Nuevo componente ImageUploader.tsx
  - Integración en DashboardPage, OnboardingPage, SettingsPage
  - Preview de imagen antes de guardar
- **Verificación:**
  - ✅ Upload funcional
  - ✅ CORS funcionando en Render + Vercel
  - ✅ FormData parsing correcto

### Próximos pasos
- Arreglos de bugs reportados

---

## Sesión 24: Onboarding Resume Bug Fix + Client Page Improvements + Double-Submit Prevention

### Resumen
Arreglo de bugs críticos: onboarding bloqueado, botones guardando múltiples veces, pantalla cliente incompleta. Merged to main, pendiente mergear ramas adicionales.

### Lo que se hizo

#### 1. Fix: Onboarding Resume Bug (Main - Merged ✅)
- **Problema:** Step names en español vs inglés causaban mismatch, usuario siempre volvía a paso 1
- **Solución:**
  - Array `STEP_KEYS` matching backend exactamente
  - Prefilled forms al recargar
  - Skip redundant API calls si paso ya completado
  - Redirect automático si onboarding incompleto
- **Files:** OnboardingPage.tsx, BusinessContext.tsx
- **Testing:** ✅ Build sin errores

#### 2. Feature: Double-Submit Prevention (Rama: fix/double-submit-buttons)
- **Problema:** Botones guardar en calendario/bloqueos clickeables múltiples veces
- **Solución:**
  - Estados `isSavingTimeSlot`, `isSavingBlock`
  - Botones deshabilitados durante API call
  - Texto "Guardando..." para feedback
- **File:** AvailabilityPage.tsx
- **Testing:** ✅ Build sin errores

#### 3. Feature: Client Page Improvements (Rama: fix/client-page-improvements)
- **BD:** Migración 009 con campos phone, whatsapp, address, instagram_url, facebook_url
- **Encabezado:** Logo, nombre, plan, contacto clickeable
- **Pre-action menu:** Elegir entre "Ver mis reservas" o "Hacer nueva reserva"
- **Files:** ClientBookingsPage.tsx, types/index.ts, migrations/009
- **Testing:** ✅ Build sin errores

### Próximos pasos
1. Mergear ramas a main
2. Agregar formulario contacto en Settings
3. Verificar emails confirmación
4. Agregar opción "Cancelar reserva" en pre-action menu

---

## Estado Actual
- **Producción:** ✅ Render (backend) + Vercel (frontend)
- **Base de datos:** ✅ Supabase PostgreSQL
- **MVP funciones:** ✅ Onboarding, Widget público, Dashboard, Portal cliente, Email
- **Últimas mejoras:** Onboarding resume fix, double-submit prevention, client page membrete
- **Rama actual:** desa (única rama de trabajo de aquí en adelante)

---

*Última actualización: 2026-06-11 (Sesión 24 - Bugs críticos arreglados)*

---

## Sesión 26: OAuth2 Gmail Integration & E2E Testing (2026-06-12)

### Resumen
Implementación completa de OAuth2 Gmail para permitir que cada negocio envíe emails desde su propia cuenta. Test E2E exitoso del flujo completo en producción (usuario → reserva). Arreglo de errores de Resend API y TypeScript.

### Lo que se hizo

#### 1. Diagnosticado y Arreglado Error de Resend API
**Problema:** Backend fallaba con `AttributeError: 'str' object has no attribute 'set'`
- Versión Resend 2.4.0 no exporta clase `Resend`
- `resend.api_key.set()` no existe en esta versión

**Solución:**
- Usar `os.environ['RESEND_API_KEY']` para configurar
- Llamar directamente a `resend.Emails.send()`
- Manejo correcto de variable de entorno

**Commits:**
- `c544bcc` - fix: correct Resend client initialization
- `820f5da` - fix: use resend.Emails.send() directly

#### 2. Test E2E Completo en Producción ✅
**Objetivo:** Validar flujo completo: usuario → negocio → servicio → profesional → reserva pública

**Flujo testeado:**
1. ✅ Registro de usuario: test-e2e-1781276454@test.com
2. ✅ Creación de negocio: "Consultorio E2E 1781276491"
3. ✅ Setup completo:
   - Sucursal: "Sucursal Principal"
   - Servicio: "Consulta General" (30 min, $150)
   - Profesional: "Dr. Test"
   - Disponibilidad: Lun-Vie 08:00-18:00
4. ✅ Reserva pública exitosa:
   - ID: d8f63e4c-a13f-421a-ae83-e39f51a7a187
   - Status: CONFIRMED
   - Fecha: 2026-06-15 11:00 UTC
   - Cliente: test-client-e2e@example.com
   - Flujo: Widget público → backend → DB ✅

**Resultado:** End-to-end booking flow completamente funcional en producción

#### 3. Implementado OAuth2 Gmail desde Cero

**Backend (Render):**
- **gmail_service.py** - Servicio de Gmail API
  - `send_email()` - Envía emails vía Gmail API
  - Maneja refresh tokens automáticamente
  - Non-blocking (errores no fallan la reserva)

- **google_oauth_router.py** - Endpoints OAuth2
  - `GET /api/google-oauth/authorize/{business_id}` - Genera URL de Google
  - `POST /api/google-oauth/callback` - Procesa código, obtiene tokens, guarda en BD
  - `DELETE /api/google-oauth/{business_id}` - Desconecta Gmail

- **resend_service.py** - Actualizado con soporte dual
  - Intenta Gmail primero si `google_email` + `google_access_token` existen
  - Fallback automático a Resend si Gmail falla o no está configurado
  - Same email templates para ambos servicios

- **Migración 010** - Schema para OAuth2:
  ```sql
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_email VARCHAR(255);
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_access_token TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMP;
  ```

**Frontend (Vercel):**
- **GmailConnect.tsx** - Componente conectar/desconectar
  - Botón "🔗 Conectar con Google"
  - Muestra estado (conectado/desconectado)
  - Opción desconectar con confirmación

- **GoogleCallbackPage.tsx** - Maneja callback de Google
  - Procesa código + state
  - Muestra spinner durante procesamiento
  - Feedback visual: éxito/error
  - Auto-redirige a Settings

- **SettingsPage.tsx** - Integración en UI
  - Nueva sección: "Email y notificaciones"
  - Subsección: "Conectar Gmail"
  - Muestra email conectado o opción conectar

- **AppRoutes.tsx** - Nueva ruta pública
  - `/settings/google-callback` - No requiere auth

- **types/index.ts** - Business interface actualizada
  - Agregados: google_email, google_access_token, google_refresh_token, google_token_expiry

**Commits:**
- `e437d7b` - feat: implement OAuth2 Gmail integration (backend)
- `ef8441f` - feat: add Gmail OAuth2 frontend UI
- `0bdf5e2` - feat: add missing Gmail OAuth2 backend files
- `187be6b` - fix: correct Gmail OAuth2 TypeScript errors

#### 4. Arreglados Errores TypeScript en Vercel
**Errores encontrados en build:**
```
GmailConnect.tsx(52,24): error TS2322 - Alert props incorrectos
SettingsPage.tsx(436-447): error TS2339 - Business.google_email no existe
```

**Soluciones:**
1. Alert component: cambio de props
   - De: `<Alert type="error" message={error} />`
   - A: `<Alert variant="error">{error}</Alert>`

2. Business interface: agregados campos Google
   - `google_email?: string`
   - `google_access_token?: string`
   - `google_refresh_token?: string`
   - `google_token_expiry?: string`

3. Result: Vercel build ahora compila exitosamente ✅

### Estado Actual
- **Frontend (Vercel):** ✅ Build exitoso, botón "Conectar Gmail" visible en Settings
- **Backend (Render):** ✅ Código listo, variables GOOGLE_CLIENT_ID/SECRET configuradas
- **Base de datos:** ✅ Migración 010 lista para ejecutar
- **Google OAuth Flow:** ⏳ Requiere verificación de redirect_uri en Google Cloud Console

### Próximos Pasos
1. **Verificar Google Cloud Console:**
   - Authorized redirect URIs debe incluir exactamente:
     ```
     https://turnos-y-reservas-4qy2.vercel.app/settings/google-callback
     ```

2. **Test flujo completo:**
   - Settings → "Email y notificaciones"
   - Click "🔗 Conectar con Google"
   - Autorizar cuenta
   - Verificar email conectado en Settings

3. **Validar emails:**
   - Hacer nueva reserva pública
   - Verificar que email sale desde Gmail del negocio (no Resend)

4. **Documentación:**
   - Actualizar RESUMEN.md con nueva feature
   - Documentar pasos setup OAuth2 para usuarios

### Deuda Técnica Identificada
- [ ] SMTP configurable por negocio (alternativa a Gmail)
- [ ] Rate limiting (slowapi configurado pero no usado)
- [ ] Health check endpoint
- [ ] Tests unitarios/e2e
- [ ] Error handling más robusto

---

*Última actualización: 2026-06-12 (Sesión 26 - OAuth2 Gmail + E2E Testing)*
