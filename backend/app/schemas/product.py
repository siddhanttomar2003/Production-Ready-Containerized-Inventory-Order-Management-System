from marshmallow import Schema, ValidationError, fields, validate, validates


class ProductSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    sku = fields.Str(
        required=True,
        validate=validate.Regexp(
            r"^[A-Z0-9]+(-[A-Z0-9]+)+$",
            error="SKU must be in uppercase alphanumeric format with hyphens (e.g., LAP-1001)."
        )
    )
    price = fields.Decimal(required=True, as_string=False)
    quantity_in_stock = fields.Int(required=True)

    @validates("quantity_in_stock")
    def validate_quantity(self, value: int) -> None:
        if value < 0:
            raise ValidationError("Quantity in stock cannot be negative.")


class ProductUpdateSchema(Schema):
    name = fields.Str()
    sku = fields.Str(
        validate=validate.Regexp(
            r"^[A-Z0-9]+(-[A-Z0-9]+)+$",
            error="SKU must be in uppercase alphanumeric format with hyphens (e.g., LAP-1001)."
        )
    )
    price = fields.Decimal(as_string=False)
    quantity_in_stock = fields.Int()

    @validates("quantity_in_stock")
    def validate_quantity(self, value: int) -> None:
        if value < 0:
            raise ValidationError("Quantity in stock cannot be negative.")


product_schema = ProductSchema()
products_schema = ProductSchema(many=True)
product_create_schema = ProductSchema()
product_update_schema = ProductUpdateSchema()
