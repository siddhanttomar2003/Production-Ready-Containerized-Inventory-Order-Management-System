from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.middleware.error_handlers import ApiError
from app.models import Product
from app.schemas import product_create_schema, product_schema, product_update_schema, products_schema


products_bp = Blueprint("products", __name__)


@products_bp.post("")
def create_product():
    payload = product_create_schema.load(request.get_json() or {})
    product = Product(**payload)
    db.session.add(product)

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise ApiError("SKU must be unique.", 409) from exc

    return jsonify(product_schema.dump(product)), 201


@products_bp.get("")
def list_products():
    products = Product.query.order_by(Product.id.desc()).all()
    return jsonify(products_schema.dump(products)), 200


@products_bp.get("/<int:product_id>")
def get_product(product_id: int):
    product = Product.query.get(product_id)
    if product is None:
        raise ApiError("Product not found.", 404)

    return jsonify(product_schema.dump(product)), 200


@products_bp.put("/<int:product_id>")
def update_product(product_id: int):
    product = Product.query.get(product_id)
    if product is None:
        raise ApiError("Product not found.", 404)

    payload = product_update_schema.load(request.get_json() or {})
    for field, value in payload.items():
        setattr(product, field, value)

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise ApiError("SKU must be unique.", 409) from exc

    return jsonify(product_schema.dump(product)), 200


@products_bp.delete("/<int:product_id>")
def delete_product(product_id: int):
    product = Product.query.get(product_id)
    if product is None:
        raise ApiError("Product not found.", 404)

    db.session.delete(product)
    db.session.commit()
    return "", 204
