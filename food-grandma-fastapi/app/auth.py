import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, Form, Header
from passlib.context import CryptContext
from sqlmodel import Session, select

from app.database import get_session
from app.models import AccessToken, Customer, Driver, Restaurant, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def issue_access_token(session: Session, user: User, token: Optional[str] = None) -> str:
    token = token or secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=1)

    existing = session.exec(select(AccessToken).where(AccessToken.token == token)).first()
    if existing:
        existing.user_id = user.id
        existing.expires = expires
        session.add(existing)
    else:
        session.add(AccessToken(token=token, user_id=user.id, expires=expires))
    session.commit()
    return token


def _get_valid_access_token(session: Session, token: Optional[str]) -> AccessToken:
    if not token:
        raise LookupError("access_token is required")

    access_token = session.exec(select(AccessToken).where(AccessToken.token == token)).first()
    now = datetime.now(timezone.utc)
    if access_token is None or access_token.expires.replace(tzinfo=timezone.utc) <= now:
        raise LookupError("invalid or expired access_token")

    return access_token


def get_customer_from_query_token(
    access_token: Optional[str] = None, session: Session = Depends(get_session)
) -> Customer:
    token = _get_valid_access_token(session, access_token)
    customer = session.exec(select(Customer).where(Customer.user_id == token.user_id)).first()
    if customer is None:
        raise LookupError("token does not belong to a customer")
    return customer


def get_customer_from_form_token(
    access_token: str = Form(...), session: Session = Depends(get_session)
) -> Customer:
    token = _get_valid_access_token(session, access_token)
    customer = session.exec(select(Customer).where(Customer.user_id == token.user_id)).first()
    if customer is None:
        raise LookupError("token does not belong to a customer")
    return customer


def get_driver_from_query_token(
    access_token: Optional[str] = None, session: Session = Depends(get_session)
) -> Driver:
    token = _get_valid_access_token(session, access_token)
    driver = session.exec(select(Driver).where(Driver.user_id == token.user_id)).first()
    if driver is None:
        raise LookupError("token does not belong to a driver")
    return driver


def get_driver_profile_auth(
    access_token: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
) -> Driver:
    if authorization is not None:
        scheme, _, value = authorization.partition(" ")
        if scheme.lower() != "bearer" or not value.strip():
            raise LookupError("missing or malformed Authorization header")
        access_token = value.strip()
    return get_driver_from_query_token(access_token, session)


def get_driver_from_form_token(
    access_token: str = Form(...), session: Session = Depends(get_session)
) -> Driver:
    token = _get_valid_access_token(session, access_token)
    driver = session.exec(select(Driver).where(Driver.user_id == token.user_id)).first()
    if driver is None:
        raise LookupError("token does not belong to a driver")
    return driver


def get_restaurant_from_bearer_token(
    authorization: Optional[str] = Header(None), session: Session = Depends(get_session)
) -> Restaurant:
    """Auth for the restaurant dashboard SPA: `Authorization: Bearer <token>`.

    Customer/driver mobile-style endpoints pass access_token as a query/form
    param instead (see get_*_from_query_token/get_*_from_form_token above) —
    this dependency is the React-dashboard-specific counterpart.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise LookupError("missing or malformed Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    access_token = _get_valid_access_token(session, token)
    restaurant = session.exec(select(Restaurant).where(Restaurant.user_id == access_token.user_id)).first()
    if restaurant is None:
        raise LookupError("token does not belong to a restaurant")
    return restaurant
