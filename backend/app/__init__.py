from flask import Flask

from app.config import get_config
from app.extensions import cors, db, migrate
from app.middleware.error_handlers import register_error_handlers
from app.middleware.request_hooks import register_request_hooks
from app.routes import register_blueprints


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}},
    )

    register_request_hooks(app)
    register_error_handlers(app)
    register_blueprints(app)

    return app
