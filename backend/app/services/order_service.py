from collections import Counter
from decimal import Decimal

from sqlalchemy import select

from app.extensions import db
from app.middleware.error_handlers import ApiError
from app.models import Customer, Order, OrderItem, Product


def place_order(payload: dict) -> Order:
    customer = Customer.query.get(payload["customer_id"])
    if customer is None:
        raise ApiError("Customer not found.", 404)

    requested_quantities = Counter()
    for item in payload["items"]:
        requested_quantities[item["product_id"]] += item["quantity"]

    product_ids = list(requested_quantities.keys())
    products = db.session.execute(
        select(Product).where(Product.id.in_(product_ids)).with_for_update()
    ).scalars().all()

    products_by_id = {product.id: product for product in products}
    missing_ids = [product_id for product_id in product_ids if product_id not in products_by_id]
    if missing_ids:
        raise ApiError("One or more products were not found.", 404, {"product_ids": missing_ids})

    for product_id, quantity in requested_quantities.items():
        product = products_by_id[product_id]
        if product.quantity_in_stock < quantity:
            raise ApiError(
                "Insufficient inventory for one or more products.",
                409,
                {
                    "product_id": product_id,
                    "available": product.quantity_in_stock,
                    "requested": quantity,
                },
            )

    order = Order(customer_id=customer.id)
    db.session.add(order)

    total_amount = Decimal("0.00")
    for product_id, quantity in requested_quantities.items():
        product = products_by_id[product_id]
        unit_price = Decimal(str(product.price))
        total_amount += unit_price * quantity
        product.quantity_in_stock -= quantity
        order.items.append(
            OrderItem(
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
            )
        )

    order.total_amount = total_amount
    db.session.commit()
    db.session.refresh(order)
    return order


def delete_order(order_id: int) -> None:
    order = Order.query.get(order_id)
    if order is None:
        raise ApiError("Order not found.", 404)

    products = db.session.execute(
        select(Product)
        .where(Product.id.in_([item.product_id for item in order.items]))
        .with_for_update()
    ).scalars().all()
    products_by_id = {product.id: product for product in products}

    for item in order.items:
        if item.product_id in products_by_id:
            products_by_id[item.product_id].quantity_in_stock += item.quantity

    db.session.delete(order)
    db.session.commit()