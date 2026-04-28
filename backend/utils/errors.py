"""
Manejo centralizado de errores de la aplicación.
"""


class AppError(Exception):
    """
    Error tipado de la aplicación.

    Lleva mensaje legible para el usuario, código interno y HTTP status code.
    El handler global se encarga de formatear la respuesta JSON.
    """

    def __init__(self, message: str, code: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
