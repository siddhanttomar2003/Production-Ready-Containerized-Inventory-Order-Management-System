from app.routes.customers import customers_bp
from app.routes.dashboard import dashboard_bp
from app.routes.health import health_bp
from app.routes.orders import orders_bp
from app.routes.products import products_bp


def register_blueprints(app):
    app.register_blueprint(health_bp, url_prefix="/api/health")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(customers_bp, url_prefix="/api/customers")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
