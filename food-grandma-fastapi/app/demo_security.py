"""Controls for the public demo; administrator secrets stay server-side."""
import os
import secrets

from fastapi import Header, HTTPException


def public_demo() -> bool:
    return os.environ.get("PUBLIC_DEMO_MODE", "false").lower() == "true"


def require_demo_admin(x_demo_reset_key: str | None = Header(default=None)) -> None:
    expected = os.environ.get("DEMO_RESET_KEY", "")
    if not expected or not x_demo_reset_key or not secrets.compare_digest(expected, x_demo_reset_key):
        raise HTTPException(status_code=403, detail="Administrator authorization required")


def demo_account_fields(body):
    if public_demo():
        body.first_name = "示範"
        body.last_name = "使用者"
        body.email = "demo@example.invalid"
        body.phone = "DEMO-PHONE"
        body.address = "網站示範地址（非真實配送地址）"
        body.name = "使用者示範餐廳"
        body.logo = ""
    return body


def sanitize_demo_profiles(session):
    """Replace personal fields in existing demo records without deleting orders."""
    from sqlmodel import select
    from app.models import User, Customer, Driver, Restaurant, Order
    for user in session.exec(select(User)).all():
        user.first_name, user.last_name = "示範使用者", str(user.id)
        user.email = f"demo-{user.id}@example.invalid"
        session.add(user)
    for customer in session.exec(select(Customer)).all():
        customer.phone, customer.address = "DEMO-PHONE", "網站示範地址（非真實配送地址）"
        customer.avatar = ""
        session.add(customer)
    for restaurant in session.exec(select(Restaurant)).all():
        restaurant.phone, restaurant.address = "DEMO-PHONE", "網站示範地址（非真實配送地址）"
        session.add(restaurant)
    for driver in session.exec(select(Driver)).all():
        driver.car_model, driver.plate_number = "示範車輛", "DEMO-000"
        driver.avatar, driver.location = "", "25.0330,121.5654"
        session.add(driver)
    for order in session.exec(select(Order)).all():
        order.address = "網站示範地址（非真實配送地址）"
        session.add(order)
    session.commit()
