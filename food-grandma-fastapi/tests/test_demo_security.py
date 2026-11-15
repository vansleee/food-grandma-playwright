from sqlmodel import select

from app.models import Order, COOKING


def test_reset_routes_reject_missing_wrong_or_unconfigured_key(client, restaurant, monkeypatch):
    for key in (None, "server-secret"):
        if key is None:
            monkeypatch.delenv("DEMO_RESET_KEY", raising=False)
        else:
            monkeypatch.setenv("DEMO_RESET_KEY", key)
        for route in ("reset", "seed", "rebuild"):
            for headers in ({}, {"X-Demo-Reset-Key": "wrong"}):
                assert client.post(f"/api/test/{route}", headers=headers).status_code == 403
    assert client.post("/api/test/reset", headers={"X-Demo-Reset-Key": "server-secret"}).status_code == 200


def test_administrator_can_rebuild(client, monkeypatch):
    monkeypatch.setenv("DEMO_RESET_KEY", "server-secret")
    monkeypatch.setenv("SEED_DEMO_DATA", "true")
    result = client.post("/api/test/rebuild", headers={"X-Demo-Reset-Key": "server-secret"})
    assert result.status_code == 200
    assert result.json()["restaurants"] == 6


def test_demo_blocks_payment_before_stripe(client, customer, make_access_token, monkeypatch):
    monkeypatch.setenv("PUBLIC_DEMO_MODE", "true")
    token = make_access_token(customer.user)
    result = client.post("/api/customer/payment_intent/", data={"total": "20", "access_token": token})
    assert result.status_code == 403


def test_demo_order_replaces_submitted_address(client, customer, meal, make_access_token, db_session, monkeypatch):
    monkeypatch.setenv("PUBLIC_DEMO_MODE", "true")
    token = make_access_token(customer.user)
    import json
    result = client.post("/api/customer/orders/", data={
        "restaurant_id": meal.restaurant_id, "address": "PRIVATE ADDRESS MUST NOT PERSIST",
        "order_details": json.dumps([{"meal_id": meal.id, "quantity": 1}]), "access_token": token,
    })
    assert result.json()["status"] == "success"
    assert db_session.exec(select(Order)).one().address == "網站示範地址（非真實配送地址）"


def test_profile_scrub_preserves_order(client, customer, restaurant, db_session):
    from app.demo_security import sanitize_demo_profiles
    order = Order(customer_id=customer.id, restaurant_id=restaurant.id, total=20, status=COOKING, address="PRIVATE")
    db_session.add(order)
    db_session.commit()
    original_id = order.id
    sanitize_demo_profiles(db_session)
    db_session.refresh(order)
    assert order.id == original_id and order.total == 20
    assert "非真實" in order.address
    db_session.refresh(customer.user)
    assert customer.user.email.endswith("@example.invalid")
