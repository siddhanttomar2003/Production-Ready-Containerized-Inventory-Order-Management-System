from sqlalchemy.exc import IntegrityError

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.middleware.error_handlers import ApiError
from app.models import Customer
from app.schemas import customer_create_schema, customer_schema, customers_schema


customers_bp = Blueprint("customers", __name__)


@customers_bp.post("")
def create_customer():
    payload = customer_create_schema.load(request.get_json() or {})
    customer = Customer(**payload)
    db.session.add(customer)

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise ApiError("Customer email must be unique.", 409) from exc

    return jsonify(customer_schema.dump(customer)), 201


@customers_bp.get("")
def list_customers():
    customers = Customer.query.order_by(Customer.id.desc()).all()
    return jsonify(customers_schema.dump(customers)), 200


@customers_bp.get("/<int:customer_id>")
def get_customer(customer_id: int):
    customer = Customer.query.get(customer_id)
    if customer is None:
        raise ApiError("Customer not found.", 404)

    return jsonify(customer_schema.dump(customer)), 200


@customers_bp.delete("/<int:customer_id>")
def delete_customer(customer_id: int):
    customer = Customer.query.get(customer_id)
    if customer is None:
        raise ApiError("Customer not found.", 404)

    db.session.delete(customer)
    db.session.commit()
    return "", 204
