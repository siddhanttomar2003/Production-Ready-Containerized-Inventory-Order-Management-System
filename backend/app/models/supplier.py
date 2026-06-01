from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db


class Supplier(db.Model):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone_number: Mapped[str] = mapped_column(String(40), nullable=False)
    logo: Mapped[str] = mapped_column(String(10), nullable=True)
    color: Mapped[str] = mapped_column(String(20), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone_number": self.phone_number,
            "logo": self.logo,
            "color": self.color,
        }
