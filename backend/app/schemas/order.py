from marshmallow import Schema, ValidationError, fields, validates_schema


class OrderItemInputSchema(Schema):
    product_id = fields.Int(required=True)
    quantity = fields.Int(required=True)


class OrderItemOutputSchema(Schema):
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    product_name = fields.Str(dump_only=True)
    quantity = fields.Int(required=True)
    unit_price = fields.Float(dump_only=True)
    line_total = fields.Float(dump_only=True)


class OrderSchema(Schema):
    id = fields.Int(dump_only=True)
    customer_id = fields.Int(required=True)
    total_amount = fields.Float(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    items = fields.List(fields.Nested(OrderItemOutputSchema), required=True)


class OrderCreateSchema(Schema):
    customer_id = fields.Int(required=True)
    items = fields.List(fields.Nested(OrderItemInputSchema), required=True)

    @validates_schema
    def validate_items(self, data, **kwargs) -> None:
        items = data.get("items", [])
        if not items:
            raise ValidationError("Order must include at least one product item.", field_name="items")

        seen_product_ids = set()
        for item in items:
            product_id = item["product_id"]
            if product_id in seen_product_ids:
                raise ValidationError(
                    "Duplicate product_id entries are not allowed.",
                    field_name="items",
                )
            seen_product_ids.add(product_id)

            if item["quantity"] <= 0:
                raise ValidationError("Ordered quantity must be greater than zero.", field_name="items")


order_schema = OrderSchema()
orders_schema = OrderSchema(many=True)
order_create_schema = OrderCreateSchema()
