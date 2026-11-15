import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SEED_DEMO_DATA"] = "false"

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel

from app.auth import hash_password, issue_access_token
from app.database import engine
from app.main import app
from app.models import Customer, Driver, Meal, Restaurant, User

RESTAURANT_PASSWORD = "pass1234"


@pytest.fixture(autouse=True)
def _fresh_db():
    SQLModel.metadata.create_all(engine)
    yield
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    with Session(engine) as session:
        yield session


@pytest.fixture
def make_user(db_session):
    def _make_user(username="user1", password="pass1234", **kwargs):
        user = User(username=username, password_hash=hash_password(password), **kwargs)
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return _make_user


@pytest.fixture
def restaurant(make_user, db_session):
    user = make_user(username="owner", password=RESTAURANT_PASSWORD, first_name="Res", last_name="Owner")
    r = Restaurant(user_id=user.id, name="Pizza House", phone="0900000000", address="Taipei", logo="sample")
    db_session.add(r)
    db_session.commit()
    db_session.refresh(r)
    return r


@pytest.fixture
def meal(restaurant, db_session):
    m = Meal(restaurant_id=restaurant.id, name="Margherita", short_description="Classic pizza", image="sample", price=10)
    db_session.add(m)
    db_session.commit()
    db_session.refresh(m)
    return m


@pytest.fixture
def customer(make_user, db_session):
    user = make_user(username="cust", first_name="Cathy", last_name="Customer")
    c = Customer(user_id=user.id, avatar="a.png", phone="0911", address="Taipei")
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


@pytest.fixture
def driver(make_user, db_session):
    user = make_user(username="drv", first_name="Dan", last_name="Driver")
    d = Driver(user_id=user.id, avatar="d.png", car_model="Tesla", plate_number="ABC-123")
    db_session.add(d)
    db_session.commit()
    db_session.refresh(d)
    return d


@pytest.fixture
def make_access_token(db_session):
    def _make_token(user, token="tok-123"):
        return issue_access_token(db_session, user, token=token)

    return _make_token


@pytest.fixture
def auth_headers_for_restaurant(db_session):
    def _headers(restaurant):
        token = issue_access_token(db_session, restaurant.user)
        return {"Authorization": f"Bearer {token}"}

    return _headers
