from marshmallow import Schema, fields, validate


class SupplierSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    phone_number = fields.Str(
        required=True,
        validate=validate.Regexp(
            r"^\+?[0-9\s\-()]{7,20}$",
            error="Invalid phone number format."
        )
    )
    logo = fields.Str(allow_none=True)
    color = fields.Str(allow_none=True)


class SupplierUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=2, max=100))
    email = fields.Email()
    phone_number = fields.Str(
        validate=validate.Regexp(
            r"^\+?[0-9\s\-()]{7,20}$",
            error="Invalid phone number format."
        )
    )
    logo = fields.Str(allow_none=True)
    color = fields.Str(allow_none=True)


supplier_schema = SupplierSchema()
suppliers_schema = SupplierSchema(many=True)
supplier_create_schema = SupplierSchema()
supplier_update_schema = SupplierUpdateSchema()
