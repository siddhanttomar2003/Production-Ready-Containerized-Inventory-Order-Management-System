from app.schemas.customer import customer_create_schema, customer_schema, customers_schema
from app.schemas.order import order_create_schema, order_schema, orders_schema
from app.schemas.product import product_create_schema, product_schema, product_update_schema, products_schema
from app.schemas.supplier import (
    supplier_create_schema,
    supplier_schema,
    supplier_update_schema,
    suppliers_schema,
)


__all__ = [
    "customer_create_schema",
    "customer_schema",
    "customers_schema",
    "order_create_schema",
    "order_schema",
    "orders_schema",
    "product_create_schema",
    "product_schema",
    "product_update_schema",
    "products_schema",
    "supplier_create_schema",
    "supplier_schema",
    "supplier_update_schema",
    "suppliers_schema",
]
