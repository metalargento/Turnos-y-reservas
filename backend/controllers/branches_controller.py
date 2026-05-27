"""
Controller de sucursales.
Orquesta operaciones de CRUD de sucursales.
"""
from typing import Dict, Any, List
from services.auth_service import auth_service
from repositories.business_repo import business_repo
from repositories.branch_repo import branch_repo
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("branches_controller")


class BranchesController:
    """Gestiona CRUD de sucursales con verificación de ownership."""

    def __init__(self):
        self.branch_repo = branch_repo
        self.business_repo = business_repo
        self.auth_service = auth_service

    def _verify_ownership(self, token: str, business_id: str) -> str:
        """Verifica que el usuario es dueño del negocio."""
        payload = self.auth_service.verify_token(token)
        owner_id = payload["sub"]

        business = self.business_repo.find_by_id(business_id)
        if not business:
            raise AppError("Negocio no encontrado", "BUSINESS_NOT_FOUND", 404)
        if business["owner_id"] != owner_id:
            raise AppError(
                "No tenés permiso para este negocio",
                "FORBIDDEN",
                403,
            )
        return owner_id

    def list_branches(self, token: str, business_id: str) -> List[Dict[str, Any]]:
        """Lista sucursales del negocio."""
        self._verify_ownership(token, business_id)
        branches = self.branch_repo.find_by_business_id(business_id)
        logger.info(
            "Sucursales listadas",
            extra={"business_id": business_id, "count": len(branches)},
        )
        return branches

    def create_branch(
        self, token: str, business_id: str, name: str,
        address: str = None, phone: str = None
    ) -> Dict[str, Any]:
        """Crea una nueva sucursal."""
        self._verify_ownership(token, business_id)

        branch = self.branch_repo.create(
            business_id=business_id,
            name=name,
            address=address,
            phone=phone,
        )
        logger.info(
            "Sucursal creada",
            extra={"branch_id": branch["id"], "business_id": business_id},
        )
        return branch

    def update_branch(
        self, token: str, branch_id: str, name: str = None,
        address: str = None, phone: str = None
    ) -> Dict[str, Any]:
        """Actualiza una sucursal."""
        branch = self.branch_repo.find_by_id(branch_id)
        if not branch:
            raise AppError("Sucursal no encontrada", "BRANCH_NOT_FOUND", 404)

        self._verify_ownership(token, branch["business_id"])

        updated = self.branch_repo.update(
            branch_id=branch_id,
            name=name,
            address=address,
            phone=phone,
        )
        logger.info(
            "Sucursal actualizada",
            extra={"branch_id": branch_id},
        )
        return updated

    def deactivate_branch(self, token: str, branch_id: str) -> bool:
        """Desactiva una sucursal (soft delete)."""
        branch = self.branch_repo.find_by_id(branch_id)
        if not branch:
            raise AppError("Sucursal no encontrada", "BRANCH_NOT_FOUND", 404)

        self._verify_ownership(token, branch["business_id"])

        self.branch_repo.set_active(branch_id, False)
        logger.info("Sucursal desactivada", extra={"branch_id": branch_id})
        return True


branches_controller = BranchesController()
