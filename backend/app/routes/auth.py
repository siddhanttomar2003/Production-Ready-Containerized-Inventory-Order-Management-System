from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.middleware.error_handlers import ApiError
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    payload = request.get_json() or {}
    email = payload.get("email", "").strip()
    password = payload.get("password", "")

    if not email or not password:
        raise ApiError("Email and password are required.", 400)

    if "@" not in email or "." not in email:
        raise ApiError("Invalid email format.", 400)

    if len(password) < 6:
        raise ApiError("Password must be at least 6 characters long.", 400)

    user = User(email=email)
    user.set_password(password)
    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise ApiError("Email address is already registered.", 409) from exc

    return jsonify({"user": user.to_dict(), "message": "Registered successfully."}), 201


@auth_bp.post("/login")
def login():
    payload = request.get_json() or {}
    email = payload.get("email", "").strip()
    password = payload.get("password", "")

    if not email or not password:
        raise ApiError("Email and password are required.", 400)

    user = User.query.filter_by(email=email).first()
    if user is None:
        # Return a custom error code so frontend can auto-switch to Sign Up flow
        return jsonify({
            "error": "User not found. Please register.",
            "code": "USER_NOT_FOUND"
        }), 404

    if not user.check_password(password):
        raise ApiError("Invalid password.", 401)

    return jsonify({
        "token": f"mock-jwt-token-for-user-{user.id}",
        "user": user.to_dict(),
        "message": "Logged in successfully."
    }), 200
