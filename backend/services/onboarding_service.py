"""
Servicio de onboarding del negocio.
Orquesta los 5 pasos del wizard de activación.
"""
from typing import Dict, Any, List, Optional
from passlib.context import CryptContext
from repositories.business_repo import business_repo
from repositories.branch_repo import branch_repo
from repositories.service_repo import service_repo
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("onboarding_service")


class OnboardingService:
    """
    Servicio de onboarding del negocio.

    Gestiona los 5 pasos del wizard:
    1. Datos del negocio
    2. Marca (logo, colores)
    3. Primera sucursal
    4. Servicios
    5. Configuración de agenda

    Valida que cada paso esté completo antes de permitir avanzar.
    """

    # Pasos del onboarding
    STEP_1_BUSINESS = "step_1_business"
    STEP_2_BRAND = "step_2_brand"
    STEP_3_BRANCH = "step_3_branch"
    STEP_4_SERVICES = "step_4_services"
    STEP_5_AGENDA = "step_5_agenda"

    def __init__(self):
        self.business_repo = business_repo
        self.branch_repo = branch_repo
        self.service_repo = service_repo

    def _generate_unique_slug(self, business_name: str, owner_id: str) -> str:
        """
        Genera un slug único para el negocio.

        Args:
            business_name: Nombre del negocio
            owner_id: UUID del owner (para evitar colisiones)

        Returns:
            Slug único y disponible
        """
        # Convertir a slug base: "Mi Peluquería" -> "mi-peluqueria"
        import re
        import unicodedata

        # Normalizar caracteres (á -> a, ñ -> n, etc.)
        normalized = unicodedata.normalize('NFKD', business_name.lower())
        slug_base = re.sub(r'[^\w\s-]', '', normalized).strip().replace(' ', '-')
        slug_base = re.sub(r'-+', '-', slug_base)[:50]  # Máximo 50 chars

        # Verificar disponibilidad
        slug = slug_base
        counter = 1
        while not self.business_repo.is_slug_available(slug):
            slug = f"{slug_base}-{counter}"
            counter += 1
            if counter > 100:  # Seguridad: máximo 100 intentos
                raise AppError("No se pudo generar un slug único", "SLUG_GENERATION_ERROR", 500)

        return slug

    def step_1_create_business(
        self,
        owner_id: str,
        name: str,
        rubro: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Paso 1: Crear el negocio.

        Args:
            owner_id: UUID del owner
            name: Nombre del negocio
            rubro: Rubro del negocio
            description: Descripción corta (opcional)

        Returns:
            Datos del negocio creado

        Raises:
            AppError: code 'BUSINESS_ALREADY_EXISTS' si el owner ya tiene un negocio
        """
        # Verificar que el owner no tenga ya un negocio (v1: un owner = un negocio)
        existing_businesses = self.business_repo.find_by_owner_id(owner_id)
        if existing_businesses:
            logger.warning(
                "Owner ya tiene negocio",
                extra={"owner_id": owner_id, "existing_business": existing_businesses[0]["id"]}
            )
            # En v1 permitimos solo un negocio por owner
            # Podés cambiar esta lógica si querés permitir múltiples
            raise AppError(
                "Ya tenés un negocio registrado",
                "BUSINESS_ALREADY_EXISTS",
                409
            )

        # Generar slug único
        slug = self._generate_unique_slug(name, owner_id)

        # Crear negocio
        business = self.business_repo.create(
            owner_id=owner_id,
            name=name,
            slug=slug,
            rubro=rubro,
            description=description
        )

        logger.info(
            "Negocio creado (paso 1 onboarding)",
            extra={"business_id": business["id"], "owner_id": owner_id}
        )

        return business

    def step_2_update_brand(
        self,
        business_id: str,
        logo_url: Optional[str],
        primary_color: str,
        secondary_color: str
    ) -> Dict[str, Any]:
        """
        Paso 2: Actualizar marca del negocio.

        Args:
            business_id: UUID del negocio
            logo_url: URL del logo (opcional)
            primary_color: Color primario en hex
            secondary_color: Color secundario en hex

        Returns:
            Datos actualizados del negocio

        Raises:
            AppError: code 'BUSINESS_NOT_FOUND' si no existe el negocio
        """
        business = self.business_repo.find_by_id(business_id)
        if not business:
            raise AppError("Negocio no encontrado", "BUSINESS_NOT_FOUND", 404)

        # Actualizar marca
        updated = self.business_repo.update_brand(
            business_id=business_id,
            logo_url=logo_url,
            primary_color=primary_color,
            secondary_color=secondary_color
        )

        logger.info(
            "Marca actualizada (paso 2 onboarding)",
            extra={"business_id": business_id, "primary_color": primary_color}
        )

        return updated

    def step_3_create_branch(
        self,
        business_id: str,
        branch_name: str,
        address: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Paso 3: Crear primera sucursal.

        Args:
            business_id: UUID del negocio
            branch_name: Nombre de la sucursal
            address: Dirección (opcional)
            phone: Teléfono (opcional)

        Returns:
            Datos de la sucursal creada

        Raises:
            AppError: code 'BUSINESS_NOT_FOUND' si no existe el negocio
        """
        business = self.business_repo.find_by_id(business_id)
        if not business:
            raise AppError("Negocio no encontrado", "BUSINESS_NOT_FOUND", 404)

        # Crear sucursal
        branch = self.branch_repo.create(
            business_id=business_id,
            name=branch_name,
            address=address,
            phone=phone
        )

        logger.info(
            "Sucursal creada (paso 3 onboarding)",
            extra={"branch_id": branch["id"], "business_id": business_id}
        )

        return branch

    def step_4_create_services(
        self,
        business_id: str,
        services_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Paso 4: Crear servicios del negocio.

        Args:
            business_id: UUID del negocio
            services_data: Lista de servicios con nombre, duración, precio, descripción

        Returns:
            Lista de servicios creados

        Raises:
            AppError: code 'BUSINESS_NOT_FOUND' si no existe el negocio
            AppError: code 'INVALID_SERVICES' si la lista está vacía
        """
        business = self.business_repo.find_by_id(business_id)
        if not business:
            raise AppError("Negocio no encontrado", "BUSINESS_NOT_FOUND", 404)

        if not services_data or len(services_data) == 0:
            raise AppError("Debes agregar al menos un servicio", "INVALID_SERVICES", 400)

        # Crear servicios
        services = self.service_repo.create_many(
            business_id=business_id,
            services_data=services_data
        )

        logger.info(
            "Servicios creados (paso 4 onboarding)",
            extra={"business_id": business_id, "count": len(services)}
        )

        return services

    def step_5_update_agenda_config(
        self,
        business_id: str,
        min_advance_hours: int,
        email_provider: str,
        smtp_host: Optional[str] = None,
        smtp_port: Optional[int] = None,
        smtp_user: Optional[str] = None,
        smtp_password: Optional[str] = None,
        google_calendar_enabled: bool = False
    ) -> Dict[str, Any]:
        """
        Paso 5: Configurar agenda y notificaciones.

        Args:
            business_id: UUID del negocio
            min_advance_hours: Horas mínimas de anticipación para reservar
            email_provider: 'resend' o 'smtp'
            smtp_host: Host SMTP (si usa smtp propio)
            smtp_port: Puerto SMTP
            smtp_user: Usuario SMTP
            smtp_password: Password SMTP (se encriptará antes de guardar)
            google_calendar_enabled: Si activa Google Calendar

        Returns:
            Datos actualizados del negocio

        Raises:
            AppError: code 'BUSINESS_NOT_FOUND' si no existe el negocio
        """
        business = self.business_repo.find_by_id(business_id)
        if not business:
            raise AppError("Negocio no encontrado", "BUSINESS_NOT_FOUND", 404)

        # Encriptar password SMTP si existe
        smtp_password_encrypted = None
        if smtp_password and email_provider == "smtp":
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            smtp_password_encrypted = pwd_context.hash(smtp_password)

        # Actualizar configuración
        updated = self.business_repo.update_agenda_config(
            business_id=business_id,
            min_advance_hours=min_advance_hours,
            email_provider=email_provider,
            smtp_host=smtp_host,
            smtp_port=smtp_port,
            smtp_user=smtp_user,
            smtp_password_encrypted=smtp_password_encrypted,
            google_calendar_enabled=google_calendar_enabled
        )

        # Marcar onboarding como completado
        self.business_repo.mark_onboarding_completed(business_id)

        logger.info(
            "Agenda configurada - onboarding completado (paso 5)",
            extra={"business_id": business_id, "email_provider": email_provider}
        )

        return updated

    def get_onboarding_progress(self, business_id: str) -> Dict[str, Any]:
        """
        Obtiene el progreso del onboarding de un negocio.

        Args:
            business_id: UUID del negocio

        Returns:
            Diccionario con el estado de cada paso y próximo paso

        Raises:
            AppError: code 'BUSINESS_NOT_FOUND' si no existe el negocio
        """
        business = self.business_repo.find_by_id(business_id)
        if not business:
            raise AppError("Negocio no encontrado", "BUSINESS_NOT_FOUND", 404)

        # Verificar qué pasos están completos
        steps_completed = []
        steps_pending = []

        # Paso 1: negocio creado (siempre está completo si existe el negocio)
        steps_completed.append(self.STEP_1_BUSINESS)

        # Paso 2: marca (logo o colores configurados)
        if business.get("primary_color") or business.get("logo_url"):
            steps_completed.append(self.STEP_2_BRAND)
        else:
            steps_pending.append(self.STEP_2_BRAND)

        # Paso 3: sucursal (al menos una sucursal creada)
        branches_count = self.branch_repo.count_by_business(business_id)
        if branches_count > 0:
            steps_completed.append(self.STEP_3_BRANCH)
        else:
            steps_pending.append(self.STEP_3_BRANCH)

        # Paso 4: servicios (al menos un servicio creado)
        services_count = self.service_repo.count_by_business(business_id)
        if services_count > 0:
            steps_completed.append(self.STEP_4_SERVICES)
        else:
            steps_pending.append(self.STEP_4_SERVICES)

        # Paso 5: agenda (min_advance_hours configurado)
        if business.get("min_advance_hours") is not None:
            steps_completed.append(self.STEP_5_AGENDA)
        else:
            steps_pending.append(self.STEP_5_AGENDA)

        # Determinar próximo paso
        next_step = steps_pending[0] if steps_pending else None

        return {
            "business_id": business_id,
            "onboarding_completed": business.get("onboarding_completed", False),
            "steps_completed": steps_completed,
            "steps_pending": steps_pending,
            "next_step": next_step
        }


# Instancia global única
onboarding_service = OnboardingService()
