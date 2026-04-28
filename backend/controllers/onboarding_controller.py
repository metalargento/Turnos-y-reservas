"""
Controller de onboarding.
Orquesta el flujo entre el router y el service de onboarding.
"""
from typing import Dict, Any, List
from services.onboarding_service import onboarding_service
from services.auth_service import auth_service
from utils.logger import get_logger

logger = get_logger("onboarding_controller")


class OnboardingController:
    """
    Controller de onboarding.

    Orquesta los 5 pasos del wizard de activación del negocio.
    No contiene lógica de negocio — delega todo al onboarding_service.
    """

    def __init__(self):
        self.onboarding_service = onboarding_service
        self.auth_service = auth_service

    def _get_owner_id_from_token(self, token: str) -> str:
        """
        Extrae el owner_id de un token JWT.

        Args:
            token: Token JWT del usuario

        Returns:
            user_id del payload

        Raises:
            AppError: code 'INVALID_TOKEN' si el token no es válido
        """
        payload = self.auth_service.verify_token(token)
        return payload["sub"]

    def step_1_create_business(
        self,
        token: str,
        name: str,
        rubro: str,
        description: str = None
    ) -> Dict[str, Any]:
        """
        Paso 1: Crear el negocio.

        Args:
            token: Token JWT del owner
            name: Nombre del negocio
            rubro: Rubro del negocio
            description: Descripción corta (opcional)

        Returns:
            Datos del negocio creado con el token de acceso actualizado
        """
        owner_id = self._get_owner_id_from_token(token)

        business = self.onboarding_service.step_1_create_business(
            owner_id=owner_id,
            name=name,
            rubro=rubro,
            description=description
        )

        # Generar nuevo token con el business_id en el payload (opcional)
        new_access_token = self.auth_service._create_access_token(owner_id)

        logger.info(
            "Paso 1 completado - negocio creado",
            extra={"business_id": business["id"], "owner_id": owner_id}
        )

        return {
            "business_id": business["id"],
            "slug": business["slug"],
            "name": business["name"],
            "access_token": new_access_token
        }

    def step_2_update_brand(
        self,
        business_id: str,
        logo_url: str = None,
        primary_color: str = "#000000",
        secondary_color: str = "#FFFFFF"
    ) -> Dict[str, Any]:
        """
        Paso 2: Actualizar marca del negocio.

        Args:
            business_id: UUID del negocio
            logo_url: URL del logo (opcional)
            primary_color: Color primario en hex
            secondary_color: Color secundario en hex

        Returns:
            Datos actualizados de la marca
        """
        updated = self.onboarding_service.step_2_update_brand(
            business_id=business_id,
            logo_url=logo_url,
            primary_color=primary_color,
            secondary_color=secondary_color
        )

        logger.info(
            "Paso 2 completado - marca actualizada",
            extra={"business_id": business_id}
        )

        return updated

    def step_3_create_branch(
        self,
        business_id: str,
        branch_name: str,
        address: str = None,
        phone: str = None
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
        """
        branch = self.onboarding_service.step_3_create_branch(
            business_id=business_id,
            branch_name=branch_name,
            address=address,
            phone=phone
        )

        logger.info(
            "Paso 3 completado - sucursal creada",
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
            services_data: Lista de servicios con nombre, duración, precio

        Returns:
            Lista de servicios creados
        """
        services = self.onboarding_service.step_4_create_services(
            business_id=business_id,
            services_data=services_data
        )

        logger.info(
            "Paso 4 completado - servicios creados",
            extra={"business_id": business_id, "count": len(services)}
        )

        return services

    def step_5_update_agenda_config(
        self,
        business_id: str,
        min_advance_hours: int,
        email_provider: str,
        smtp_host: str = None,
        smtp_port: int = None,
        smtp_user: str = None,
        smtp_password: str = None,
        google_calendar_enabled: bool = False
    ) -> Dict[str, Any]:
        """
        Paso 5: Configurar agenda y notificaciones.

        Args:
            business_id: UUID del negocio
            min_advance_hours: Horas mínimas de anticipación
            email_provider: 'resend' o 'smtp'
            smtp_host: Host SMTP (si usa smtp propio)
            smtp_port: Puerto SMTP
            smtp_user: Usuario SMTP
            smtp_password: Password SMTP
            google_calendar_enabled: Si activa Google Calendar

        Returns:
            Datos actualizados de la configuración
        """
        updated = self.onboarding_service.step_5_update_agenda_config(
            business_id=business_id,
            min_advance_hours=min_advance_hours,
            email_provider=email_provider,
            smtp_host=smtp_host,
            smtp_port=smtp_port,
            smtp_user=smtp_user,
            smtp_password=smtp_password,
            google_calendar_enabled=google_calendar_enabled
        )

        logger.info(
            "Paso 5 completado - onboarding finalizado",
            extra={"business_id": business_id}
        )

        return updated

    def get_progress(self, business_id: str) -> Dict[str, Any]:
        """
        Obtiene el progreso del onboarding.

        Args:
            business_id: UUID del negocio

        Returns:
            Diccionario con pasos completados, pendientes y próximo paso
        """
        return self.onboarding_service.get_onboarding_progress(business_id)


# Instancia global única
onboarding_controller = OnboardingController()
