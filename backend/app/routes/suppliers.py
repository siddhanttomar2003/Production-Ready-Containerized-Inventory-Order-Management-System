from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.middleware.error_handlers import ApiError
from app.models.supplier import Supplier
from app.schemas.supplier import (
    supplier_create_schema,
    supplier_schema,
    supplier_update_schema,
    suppliers_schema,
)

suppliers_bp = Blueprint("suppliers", __name__)


def seed_suppliers_if_empty():
    if Supplier.query.count() == 0:
        initial_suppliers = [
            {"name": "Apple", "email": "apple@gmail.com", "phone_number": "+63 123 4243", "logo": "", "color": "#1a1a1a"},
            {"name": "Samsung", "email": "samsung@gmail.com", "phone_number": "+63 133 3453", "logo": "S", "color": "#0f3c99"},
            {"name": "Mugna Tech", "email": "logitech@gmail.com", "phone_number": "+63 433 4451", "logo": "M", "color": "#0ea5e9"},
            {"name": "Logitech", "email": "xiao.mi@gmail.com", "phone_number": "+63 433 4531", "logo": "L", "color": "#10b981"},
            {"name": "Asus", "email": "asus@gmail.com", "phone_number": "+63 234 6457", "logo": "A", "color": "#0053a6"},
            {"name": "Lian Li", "email": "microsoft@gmail.com", "phone_number": "+63 546 8345", "logo": "LL", "color": "#475569"},
            {"name": "NZXT", "email": "hello@mugna.tech", "phone_number": "+63 917 1033 599", "logo": "N", "color": "#7c3aed"},
            {"name": "Xiaomi", "email": "lianli@gmail.com", "phone_number": "+63 123 3345", "logo": "X", "color": "#ea580c"},
            {"name": "Microsoft", "email": "akko@gmail.com", "phone_number": "+63 334 5673", "logo": "MS", "color": "#f25022"},
            {"name": "Sony", "email": "intel@gmail.com", "phone_number": "+63 986 7465", "logo": "S", "color": "#000000"},
            {"name": "Dell", "email": "nvidia@gmail.com", "phone_number": "+63 461 4677", "logo": "D", "color": "#007dbb"}
        ]
        for s in initial_suppliers:
            db.session.add(Supplier(**s))
        db.session.commit()


@suppliers_bp.post("")
def create_supplier():
    payload = supplier_create_schema.load(request.get_json() or {})
    supplier = Supplier(**payload)
    db.session.add(supplier)

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise ApiError("Supplier email must be unique.", 409) from exc

    return jsonify(supplier_schema.dump(supplier)), 201


@suppliers_bp.get("")
def list_suppliers():
    seed_suppliers_if_empty()
    suppliers = Supplier.query.order_by(Supplier.id.desc()).all()
    return jsonify(suppliers_schema.dump(suppliers)), 200


@suppliers_bp.get("/<int:supplier_id>")
def get_supplier(supplier_id: int):
    supplier = Supplier.query.get(supplier_id)
    if supplier is None:
        raise ApiError("Supplier not found.", 404)

    return jsonify(supplier_schema.dump(supplier)), 200


@suppliers_bp.put("/<int:supplier_id>")
def update_supplier(supplier_id: int):
    supplier = Supplier.query.get(supplier_id)
    if supplier is None:
        raise ApiError("Supplier not found.", 404)

    payload = supplier_update_schema.load(request.get_json() or {})
    for field, value in payload.items():
        setattr(supplier, field, value)

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise ApiError("Supplier email must be unique.", 409) from exc

    return jsonify(supplier_schema.dump(supplier)), 200


@suppliers_bp.delete("/<int:supplier_id>")
def delete_supplier(supplier_id: int):
    supplier = Supplier.query.get(supplier_id)
    if supplier is None:
        raise ApiError("Supplier not found.", 404)

    db.session.delete(supplier)
    db.session.commit()
    return "", 204
