from flask import Blueprint, current_app, jsonify

from app.models import Customer, Order, Product


dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("")
def get_dashboard_summary():
    low_stock_threshold = current_app.config["LOW_STOCK_THRESHOLD"]
    low_stock_products = (
        Product.query.filter(Product.quantity_in_stock <= low_stock_threshold)
        .order_by(Product.quantity_in_stock.asc(), Product.name.asc())
        .all()
    )

    return jsonify(
        {
            "total_products": Product.query.count(),
            "total_customers": Customer.query.count(),
            "total_orders": Order.query.count(),
            "low_stock_products": [product.to_dict() for product in low_stock_products],
        }
    ), 200
