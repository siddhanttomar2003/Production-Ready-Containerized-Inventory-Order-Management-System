from flask import Blueprint, jsonify, request

from app.middleware.error_handlers import ApiError
from app.models import Order
from app.schemas import order_create_schema, order_schema, orders_schema
from app.services.order_service import delete_order, place_order


orders_bp = Blueprint("orders", __name__)


@orders_bp.post("")
def create_order():
    payload = order_create_schema.load(request.get_json() or {})
    order = place_order(payload)
    return jsonify(order_schema.dump(order)), 201


@orders_bp.get("")
def list_orders():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify(orders_schema.dump(orders)), 200


@orders_bp.get("/<int:order_id>")
def get_order(order_id: int):
    order = Order.query.get(order_id)
    if order is None:
        raise ApiError("Order not found.", 404)

    return jsonify(order_schema.dump(order)), 200


@orders_bp.delete("/<int:order_id>")
def remove_order(order_id: int):
    delete_order(order_id)
    return "", 204
