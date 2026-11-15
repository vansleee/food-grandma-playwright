"""
REST API layer tests (customer / driver JSON API) — ported from the Django
version's coreapp/test_apis.py so both targets exercise the same business
rules: ordering, outstanding-order blocking, driver pickup exclusivity,
Stripe mocking.
"""

import json

from sqlmodel import select

from app.models import COOKING, ONTHEWAY, Order, OrderDetails, READY


def test_customer_get_restaurants(client, restaurant):
    resp = client.get("/api/customer/restaurants/")
    assert resp.status_code == 200
    data = resp.json()["restaurants"]
    assert len(data) == 1
    assert data[0]["name"] == "Pizza House"
    assert data[0]["logo"].startswith("http")


def test_customer_get_meals(client, restaurant, meal):
    resp = client.get(f"/api/customer/meals/{restaurant.id}")
    assert resp.status_code == 200
    meals = resp.json()["meals"]
    assert meals[0]["name"] == "Margherita"
    assert meals[0]["price"] == 10


def test_customer_add_order_success(client, db_session, customer, restaurant, meal, make_access_token):
    token = make_access_token(customer.user)
    payload = {
        "access_token": token,
        "restaurant_id": restaurant.id,
        "address": "Taipei 101",
        "order_details": json.dumps([{"meal_id": meal.id, "quantity": 3}]),
    }
    resp = client.post("/api/customer/orders/", data=payload)

    assert resp.status_code == 200
    assert resp.json() == {"status": "success"}

    order = db_session.exec(select(Order).where(Order.customer_id == customer.id)).one()
    assert order.total == 30
    assert order.status == COOKING
    assert db_session.exec(
        select(OrderDetails).where(OrderDetails.order_id == order.id, OrderDetails.meal_id == meal.id, OrderDetails.quantity == 3)
    ).first() is not None


def test_customer_add_order_requires_address(client, db_session, customer, restaurant, meal, make_access_token):
    token = make_access_token(customer.user)
    resp = client.post("/api/customer/orders/", data={
        "access_token": token, "restaurant_id": restaurant.id, "address": "",
        "order_details": json.dumps([{"meal_id": meal.id, "quantity": 1}]),
    })
    body = resp.json()
    assert body["status"] == "failed"
    assert "Address" in body["error"]
    assert db_session.exec(select(Order).where(Order.customer_id == customer.id)).first() is None


def test_customer_add_order_blocked_by_outstanding_order(client, db_session, customer, restaurant, meal, make_access_token):
    token = make_access_token(customer.user)
    db_session.add(Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=COOKING, address="old"))
    db_session.commit()

    resp = client.post("/api/customer/orders/", data={
        "access_token": token, "restaurant_id": restaurant.id, "address": "new addr",
        "order_details": json.dumps([{"meal_id": meal.id, "quantity": 1}]),
    })
    body = resp.json()
    assert body["status"] == "failed"
    assert "last order" in body["error"]


def test_customer_get_latest_order_status(client, db_session, customer, restaurant, make_access_token):
    token = make_access_token(customer.user)
    db_session.add(Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=READY, address="addr"))
    db_session.commit()

    resp = client.get("/api/customer/orders/latest/status", params={"access_token": token})
    assert resp.status_code == 200
    assert resp.json()["last_order_status"]["status"] == "Ready"


def test_create_payment_intent_mocks_stripe(client, customer, make_access_token, monkeypatch):
    token = make_access_token(customer.user)

    class FakeIntent:
        client_secret = "secret_abc"

    captured = {}

    def fake_create(**kwargs):
        captured.update(kwargs)
        return FakeIntent()

    monkeypatch.setattr("app.routers.customer.stripe.PaymentIntent.create", fake_create)

    resp = client.post("/api/customer/payment_intent/", data={"access_token": token, "total": "25"})

    assert resp.status_code == 200
    assert resp.json() == {"client_secret": "secret_abc"}
    assert captured["amount"] == 2500
    assert captured["currency"] == "aud"


def test_driver_get_ready_orders(client, db_session, restaurant, customer, driver):
    db_session.add(Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=READY, address="addr"))
    db_session.add(Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=COOKING, address="addr"))
    db_session.commit()

    resp = client.get("/api/driver/orders/")
    assert resp.status_code == 200
    assert len(resp.json()["orders"]) == 1


def test_driver_pick_order_success(client, db_session, restaurant, customer, driver, make_access_token):
    token = make_access_token(driver.user)
    order = Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=READY, address="addr")
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    resp = client.post(f"/api/driver/orders/{order.id}/claim", data={"access_token": token})
    assert resp.json() == {"status": "success"}

    db_session.refresh(order)
    assert order.driver_id == driver.id
    assert order.status == ONTHEWAY
    assert order.picked_at is not None


def test_driver_pick_order_allowed_with_two_outstanding(client, db_session, restaurant, customer, driver, make_access_token):
    token = make_access_token(driver.user)
    for _ in range(2):
        db_session.add(Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=ONTHEWAY, address="addr", driver_id=driver.id))
    new_order = Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=READY, address="addr")
    db_session.add(new_order)
    db_session.commit()
    db_session.refresh(new_order)

    resp = client.post(f"/api/driver/orders/{new_order.id}/claim", data={"access_token": token})
    body = resp.json()
    assert body == {"status": "success"}

    db_session.refresh(new_order)
    assert new_order.driver_id == driver.id
    assert new_order.status == ONTHEWAY


def test_driver_pick_order_blocked_at_three_outstanding(client, db_session, restaurant, customer, driver, make_access_token):
    token = make_access_token(driver.user)
    for _ in range(3):
        db_session.add(Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=ONTHEWAY, address="addr", driver_id=driver.id))
    new_order = Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=READY, address="addr")
    db_session.add(new_order)
    db_session.commit()
    db_session.refresh(new_order)

    resp = client.post(f"/api/driver/orders/{new_order.id}/claim", data={"access_token": token})
    body = resp.json()
    assert body == {
        "status": "failed",
        "error": "目前進行配送的訂單已達接單上限，請完成配送後再接取訂單。",
    }

    db_session.refresh(new_order)
    assert new_order.driver_id is None


def test_driver_get_active_orders_returns_all_claimed_orders(client, db_session, restaurant, customer, driver, make_access_token):
    token = make_access_token(driver.user)
    orders = [
        Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=ONTHEWAY, address="addr", driver_id=driver.id)
        for _ in range(2)
    ]
    db_session.add_all(orders)
    db_session.commit()

    resp = client.get("/api/driver/orders/active", params={"access_token": token})

    assert resp.status_code == 200
    assert {order["id"] for order in resp.json()["orders"]} == {order.id for order in orders}


def test_driver_complete_order(client, db_session, restaurant, customer, driver, make_access_token):
    token = make_access_token(driver.user)
    order = Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=ONTHEWAY, address="addr", driver_id=driver.id)
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    resp = client.patch(f"/api/driver/orders/{order.id}", data={"access_token": token})
    assert resp.json() == {"status": "success"}

    from app.models import DELIVERED
    db_session.refresh(order)
    assert order.status == DELIVERED


def test_driver_update_location(client, db_session, driver, make_access_token):
    token = make_access_token(driver.user)
    resp = client.put("/api/driver/location", data={"access_token": token, "location": "25.0,121.5"})
    assert resp.json() == {"status": "success"}

    db_session.refresh(driver)
    assert driver.location == "25.0,121.5"


def test_driver_get_profile(client, driver, make_access_token):
    token = make_access_token(driver.user)
    resp = client.get("/api/driver/me/", params={"access_token": token})
    assert resp.status_code == 200
    profile = resp.json()["driver"]
    assert profile["name"] == "Dan Driver"
    assert profile["car_model"] == "Tesla"
