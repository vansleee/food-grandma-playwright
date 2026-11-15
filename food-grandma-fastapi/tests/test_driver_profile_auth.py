from datetime import datetime, timedelta, timezone

import pytest
from sqlmodel import select
from app.models import AccessToken


@pytest.fixture
def driver_token(driver, make_access_token):
    return make_access_token(driver.user, token="exercise-driver-token")


def test_query_token(client, driver, driver_token):
    response = client.get("/api/driver/me/", params={"access_token": driver_token})
    assert response.status_code == 200
    assert response.json()["driver"]["id"] == driver.id


def test_bearer_token(client, driver, driver_token):
    response = client.get("/api/driver/me/", headers={"Authorization": f"Bearer {driver_token}"})
    assert response.status_code == 200
    assert response.json()["driver"]["id"] == driver.id


@pytest.mark.parametrize("authorization", [None, "Bearer invalid", "Basic invalid"])
def test_rejects_missing_or_invalid_token(client, authorization):
    headers = {"Authorization": authorization} if authorization else {}
    assert client.get("/api/driver/me/", headers=headers).status_code == 401


def test_rejects_restaurant_token(client, restaurant, make_access_token):
    token = make_access_token(restaurant.user)
    assert client.get("/api/driver/me/", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_rejects_expired_token(client, db_session, driver_token):
    token = db_session.exec(select(AccessToken).where(AccessToken.token == driver_token)).one()
    token.expires = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.add(token)
    db_session.commit()
    assert client.get("/api/driver/me/", headers={"Authorization": f"Bearer {driver_token}"}).status_code == 401


def test_rejects_invalid_header_even_with_valid_query(client, driver_token):
    response = client.get("/api/driver/me/", params={"access_token": driver_token},
                          headers={"Authorization": "Bearer invalid"})
    assert response.status_code == 401
