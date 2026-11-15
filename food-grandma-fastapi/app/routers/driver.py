from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Form, Query
from sqlmodel import Session, select

from app.auth import (
    get_driver_from_form_token,
    get_driver_from_query_token,
    get_driver_profile_auth,
)
from app.demo_security import public_demo
from app.database import get_session
from app.models import DELIVERED, Driver, ONTHEWAY, Order, READY
from app.serializers import serialize_driver_profile, serialize_order

router = APIRouter()
MAX_OUTSTANDING_ORDERS = 3


def current_weekdays() -> list[datetime]:
    today = datetime.now(timezone.utc)
    offset = today.weekday()
    return [today + timedelta(days=i) for i in range(0 - offset, 7 - offset)]


@router.get("/api/driver/orders/")
def driver_get_orders(status: str = Query("ready"), session: Session = Depends(get_session)):
    if status.lower() != "ready":
        return {"status": "failed", "error": "Only status=ready is supported"}

    orders = session.exec(
        select(Order)
        .where(Order.status == READY, Order.driver_id.is_(None))
        .order_by(Order.id.desc())
    ).all()
    return {"orders": [serialize_order(session, o) for o in orders]}


@router.post("/api/driver/orders/{order_id}/claim")
def driver_pick_order(
    order_id: int,
    driver: Driver = Depends(get_driver_from_form_token),
    session: Session = Depends(get_session),
):
    outstanding_count = len(
        session.exec(
            select(Order).where(Order.driver_id == driver.id, Order.status == ONTHEWAY)
        ).all()
    )
    if outstanding_count >= MAX_OUTSTANDING_ORDERS:
        return {
            "status": "failed",
            "error": "目前進行配送的訂單已達接單上限，請完成配送後再接取訂單。",
        }

    order = session.exec(
        select(Order).where(Order.id == order_id, Order.driver_id.is_(None), Order.status == READY)
    ).first()
    if order is None:
        return {"status": "failed", "error": "This order has been picked up by another"}

    order.driver_id = driver.id
    order.status = ONTHEWAY
    order.picked_at = datetime.now(timezone.utc)
    session.add(order)
    session.commit()

    return {"status": "success"}


@router.get("/api/driver/orders/latest")
def driver_get_latest_order(
    driver: Driver = Depends(get_driver_from_query_token),
    session: Session = Depends(get_session),
):
    order = session.exec(
        select(Order)
        .where(Order.driver_id == driver.id, Order.status == ONTHEWAY)
        .order_by(Order.id.desc())
    ).first()
    return {"order": serialize_order(session, order) if order else None}


@router.get("/api/driver/orders/active")
def driver_get_active_orders(
    driver: Driver = Depends(get_driver_from_query_token),
    session: Session = Depends(get_session),
):
    orders = session.exec(
        select(Order)
        .where(Order.driver_id == driver.id, Order.status == ONTHEWAY)
        .order_by(Order.picked_at.desc(), Order.id.desc())
    ).all()
    return {"orders": [serialize_order(session, order) for order in orders]}


@router.patch("/api/driver/orders/{order_id}")
def driver_complete_order(
    order_id: int,
    driver: Driver = Depends(get_driver_from_form_token),
    session: Session = Depends(get_session),
):
    order = session.exec(
        select(Order).where(Order.id == order_id, Order.driver_id == driver.id)
    ).first()
    if order:
        order.status = DELIVERED
        session.add(order)
        session.commit()

    return {"status": "success"}


@router.get("/api/driver/revenue/")
def driver_get_revenue(
    driver: Driver = Depends(get_driver_from_query_token),
    session: Session = Depends(get_session),
):
    revenue = {}
    for day in current_weekdays():
        orders = session.exec(
            select(Order).where(
                Order.driver_id == driver.id,
                Order.status == DELIVERED,
                Order.created_at >= day.replace(hour=0, minute=0, second=0, microsecond=0),
                Order.created_at < day.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1),
            )
        ).all()
        revenue[day.strftime("%a")] = sum(o.total for o in orders)

    return {"revenue": revenue}


@router.put("/api/driver/location")
def driver_update_location(
    location: str = Form(...),
    driver: Driver = Depends(get_driver_from_form_token),
    session: Session = Depends(get_session),
):
    if public_demo():
        location = "25.0330,121.5654"
    driver.location = location
    session.add(driver)
    session.commit()
    return {"status": "success"}


@router.get("/api/driver/me/")
def driver_get_profile(driver: Driver = Depends(get_driver_profile_auth)):
    return {"driver": serialize_driver_profile(driver)}


@router.put("/api/driver/me/")
def driver_update_profile(
    car_model: str = Form(...),
    plate_number: str = Form(...),
    driver: Driver = Depends(get_driver_from_form_token),
    session: Session = Depends(get_session),
):
    if public_demo():
        car_model, plate_number = "示範車輛", "DEMO-000"
    driver.car_model = car_model
    driver.plate_number = plate_number
    session.add(driver)
    session.commit()
    return {"status": "success"}
