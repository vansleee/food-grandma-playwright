"""
Restaurant dashboard JSON API tests — this surface used to be Jinja2/session
HTML (see git history / the target's README "intentional deviations") and is
now bearer-token JSON, consumed by the React frontend in ../food-grandma-management/ (a sibling folder at the parent repo's root).
"""

from app.models import COOKING, DELIVERED, Order


def test_orders_requires_auth(client):
    resp = client.get("/api/restaurant/orders/")
    assert resp.status_code == 401


def test_sign_up_issues_usable_token(client):
    resp = client.post("/api/restaurant/sign_up/", json={
        "username": "newowner", "password": "secret123", "first_name": "New", "last_name": "Owner",
        "email": "new@example.com", "name": "New Diner", "phone": "0900", "address": "Taipei",
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]

    resp = client.get("/api/restaurant/me/", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["restaurant"]["name"] == "New Diner"


def test_meal_crud_scoped_to_owner(client, restaurant, auth_headers_for_restaurant):
    headers = auth_headers_for_restaurant(restaurant)

    resp = client.post("/api/restaurant/meals/", json={"name": "Margherita", "price": 10}, headers=headers)
    assert resp.status_code == 200
    meal_id = resp.json()["meal"]["id"]

    resp = client.get("/api/restaurant/meals/", headers=headers)
    assert len(resp.json()["meals"]) == 1

    resp = client.put(f"/api/restaurant/meals/{meal_id}", json={"name": "Margherita XL", "price": 15}, headers=headers)
    assert resp.json()["meal"]["name"] == "Margherita XL"


def test_meal_edit_rejects_other_restaurant(client, restaurant, meal, make_user, db_session, auth_headers_for_restaurant):
    from app.models import Restaurant

    other_user = make_user(username="other-owner")
    other = Restaurant(user_id=other_user.id, name="Other Place", phone="0900", address="Taipei", logo="")
    db_session.add(other)
    db_session.commit()
    db_session.refresh(other)

    headers = auth_headers_for_restaurant(other)
    resp = client.put(f"/api/restaurant/meals/{meal.id}", json={"name": "Hijacked", "price": 1}, headers=headers)
    assert resp.json()["status"] == "failed"


def test_order_list_and_ready_transition(client, db_session, restaurant, customer, auth_headers_for_restaurant):
    order = Order(customer_id=customer.id, restaurant_id=restaurant.id, total=20, status=COOKING, address="Taipei")
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    headers = auth_headers_for_restaurant(restaurant)
    resp = client.get("/api/restaurant/orders/", headers=headers)
    assert len(resp.json()["orders"]) == 1

    resp = client.patch(f"/api/restaurant/orders/{order.id}", headers=headers)
    assert resp.json()["order"]["status"] == "Ready"

    db_session.refresh(order)
    assert order.status == 2  # READY


def test_ready_transition_ignores_non_cooking(client, db_session, restaurant, customer, auth_headers_for_restaurant):
    order = Order(customer_id=customer.id, restaurant_id=restaurant.id, total=20, status=DELIVERED, address="Taipei")
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    headers = auth_headers_for_restaurant(restaurant)
    client.patch(f"/api/restaurant/orders/{order.id}", headers=headers)

    db_session.refresh(order)
    assert order.status == DELIVERED


def test_report_shape(client, restaurant, auth_headers_for_restaurant):
    resp = client.get("/api/restaurant/report/", headers=auth_headers_for_restaurant(restaurant))
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["revenue"]) == 7
    assert len(body["weekday_labels"]) == 7


def test_notifications_counts_new_orders(client, db_session, restaurant, customer, auth_headers_for_restaurant):
    headers = auth_headers_for_restaurant(restaurant)
    resp = client.get("/api/restaurant/notifications/", headers=headers)
    assert resp.json()["notification"] == 0

    db_session.add(Order(customer_id=customer.id, restaurant_id=restaurant.id, total=10, status=COOKING, address="a"))
    db_session.commit()

    resp = client.get("/api/restaurant/notifications/", headers=headers)
    assert resp.json()["notification"] == 1


def test_account_update(client, restaurant, auth_headers_for_restaurant):
    headers = auth_headers_for_restaurant(restaurant)
    resp = client.put("/api/restaurant/me/", json={
        "first_name": "Updated", "last_name": "Owner", "email": "u@example.com",
        "name": "Renamed Diner", "phone": "0900", "address": "Taipei", "logo": "",
    }, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["restaurant"]["name"] == "Renamed Diner"
    assert resp.json()["user"]["first_name"] == "Updated"
