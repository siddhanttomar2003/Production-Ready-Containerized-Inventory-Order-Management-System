import logging

from flask import jsonify
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException

from app.extensions import db


logger = logging.getLogger(__name__)


class ApiError(Exception):
    def __init__(self, message: str, status_code: int = 400, details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        db.session.rollback()
        return (
            jsonify({"error": error.message, "details": error.details}),
            error.status_code,
        )

    @app.errorhandler(ValidationError)
    def handle_validation_error(error: ValidationError):
        db.session.rollback()
        return jsonify({"error": "Validation failed.", "details": error.messages}), 400

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        db.session.rollback()
        return jsonify({"error": error.description}), error.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        db.session.rollback()
        logger.exception("Unhandled server error", exc_info=error)
        return jsonify({"error": "Internal server error."}), 500
