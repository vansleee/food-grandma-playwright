from typing import Optional

from fastapi import Request
from sqlmodel import Session, select

from app.models import Customer, Driver, Meal, Order, OrderDetails, Restaurant


def to_absolute_media_url(request: Request, value: str) -> str:
    """Mirrors Django's SerializerMethodField that calls request.build_absolute_uri()
    on a CloudinaryField's .url — here `value` is just a plain string (see README for why),
    so any bare placeholder becomes a real absolute URL under /media/<value>.
    """
    if not value:
        return ""
    if value.startswith("http://") or value.startswith("https://"):
        return value
    return f"{str(request.base_url).rstrip('/')}/media/{value}"


def serialize_restaurant(request: Request, restaurant: Restaurant) -> dict:
    return {
        "id": restaurant.id,
        "name": restaurant.name,
        "phone": restaurant.phone,
        "address": restaurant.address,
        "logo": to_absolute_media_url(request, restaurant.logo),
    }


def serialize_meal(request: Request, meal: Meal) -> dict:
    return {
        "id": meal.id,
        "name": meal.name,
        "short_description": meal.short_description,
        "image": to_absolute_media_url(request, meal.image),
        "price": meal.price,
    }


def serialize_driver_profile(driver: Driver) -> dict:
    return {
        "id": driver.id,
        "name": driver.user.get_full_name(),
        "avatar": driver.avatar,
        "car_model": driver.car_model,
        "plate_number": driver.plate_number,
    }


def _serialize_order_driver(driver: Optional[Driver]) -> Optional[dict]:
    if driver is None:
        return None
    return {
        "id": driver.id,
        "name": driver.user.get_full_name(),
        "avatar": driver.avatar,
        "car_model": driver.car_model,
        "plate_number": driver.plate_number,
    }


def _serialize_order_customer(customer: Customer) -> dict:
    return {
        "id": customer.id,
        "name": customer.user.get_full_name(),
        "avatar": customer.avatar,
        "address": customer.address,
    }


def _serialize_order_restaurant(restaurant: Restaurant) -> dict:
    return {
        "id": restaurant.id,
        "name": restaurant.name,
        "phone": restaurant.phone,
        "address": restaurant.address,
    }


def serialize_order(session: Session, order: Order) -> dict:
    customer = session.get(Customer, order.customer_id)
    restaurant = session.get(Restaurant, order.restaurant_id)
    driver = session.get(Driver, order.driver_id) if order.driver_id else None
    details = session.exec(select(OrderDetails).where(OrderDetails.order_id == order.id)).all()

    order_details = []
    for detail in details:
        meal = session.get(Meal, detail.meal_id)
        order_details.append({
            "id": detail.id,
            "meal": {"id": meal.id, "name": meal.name, "price": meal.price},
            "quantity": detail.quantity,
            "sub_total": detail.sub_total,
        })

    return {
        "id": order.id,
        "customer": _serialize_order_customer(customer),
        "restaurant": _serialize_order_restaurant(restaurant),
        "driver": _serialize_order_driver(driver),
        "order_details": order_details,
        "total": order.total,
        "status": order.status_display(),
        "address": order.address,
    }


def serialize_order_status(order: Order) -> dict:
    return {"id": order.id, "status": order.status_display()}
