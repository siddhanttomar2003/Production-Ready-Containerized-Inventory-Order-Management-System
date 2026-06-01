from marshmallow import Schema, fields, validate, ValidationError


def validate_phone(val):
    digits = [c for c in val if c.isdigit()]
    if len(digits) != 10:
        raise ValidationError("Phone number must contain exactly 10 digits.")


class CustomerSchema(Schema):
    id = fields.Int(dump_only=True)
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    phone_number = fields.Str(
        required=True,
        validate=validate_phone
    )


customer_schema = CustomerSchema()
customers_schema = CustomerSchema(many=True)
customer_create_schema = CustomerSchema()
