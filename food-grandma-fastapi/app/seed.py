from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from app.auth import hash_password
from app.models import (
    AccessToken,
    COOKING,
    Customer,
    Driver,
    Meal,
    Order,
    OrderDetails,
    Restaurant,
    User,
)

DEMO_PASSWORD = "testpass123"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "password@321"


def reset_demo_data(session: Session, *, commit: bool = True) -> None:
    for model in (OrderDetails, Order, Meal, Restaurant, Customer, Driver, AccessToken, User):
        for row in session.exec(select(model)).all():
            session.delete(row)
    if commit:
        session.commit()
    else:
        session.flush()


def seed_demo_data(session: Session, *, commit: bool = True) -> dict:
    owner = User(
        username=ADMIN_USERNAME, password_hash=hash_password(ADMIN_PASSWORD),
        first_name="Owner", last_name="One", email="owner1@example.invalid",
    )
    session.add(owner)
    session.flush()
    restaurant = Restaurant(
        user_id=owner.id, name="Pizza Palace", phone="DEMO-PHONE",
        address="1 Demo St, Taipei", logo="sample",
    )
    session.add(restaurant)

    customer_user = User(
        username="customer1", password_hash=hash_password(DEMO_PASSWORD),
        first_name="Cathy", last_name="Customer", email="customer1@example.invalid",
    )
    session.add(customer_user)
    session.flush()
    customer = Customer(user_id=customer_user.id, avatar="sample", phone="DEMO-PHONE", address="2 Demo St, Taipei")
    session.add(customer)

    driver_user = User(
        username="driver1", password_hash=hash_password(DEMO_PASSWORD),
        first_name="Dan", last_name="Driver", email="driver1@example.invalid",
    )
    session.add(driver_user)
    session.flush()
    driver = Driver(user_id=driver_user.id, avatar="sample", car_model="Civic", plate_number="DEMO-000")
    session.add(driver)

    session.flush()

    margherita = Meal(restaurant_id=restaurant.id, name="Margherita", short_description="Classic cheese & tomato", image="sample", price=10)
    session.add(margherita)
    pepperoni = Meal(restaurant_id=restaurant.id, name="Pepperoni", short_description="Pepperoni & mozzarella", image="sample", price=12)
    session.add(pepperoni)
    session.flush()

    order = Order(
        customer_id=customer.id, restaurant_id=restaurant.id, total=20,
        status=COOKING, address="3 Demo St, Taipei",
    )
    session.add(order)
    session.flush()
    session.add(OrderDetails(order_id=order.id, meal_id=margherita.id, quantity=2, sub_total=20))

    expires = datetime.now(timezone.utc) + timedelta(days=1)
    session.add(AccessToken(token="e2e-customer-token", user_id=customer_user.id, expires=expires))
    session.add(AccessToken(token="e2e-driver-token", user_id=driver_user.id, expires=expires))

    if commit:
        session.commit()
    else:
        session.flush()

    return {
        "restaurant_login": {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        "customer_access_token": "e2e-customer-token",
        "driver_access_token": "e2e-driver-token",
        "seeded_order_id": order.id,
        "seeded_order_status": "COOKING",
    }
