from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Request
from sqlmodel import Session, func, select

from app.auth import get_restaurant_from_bearer_token, hash_password, issue_access_token
from app.demo_security import demo_account_fields
from app.database import get_session
from app.models import COOKING, DELIVERED, Driver, Meal, Order, OrderDetails, READY, Restaurant, User
from app.schemas import MealRequest, RestaurantAccountUpdateRequest, RestaurantSignUpRequest
from app.serializers import serialize_meal, serialize_order, serialize_restaurant

router = APIRouter(prefix="/api/restaurant")


def _serialize_user(user: User) -> dict:
    return {
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
    }


@router.post("/sign_up/")
def sign_up(
    body: RestaurantSignUpRequest,
    session: Session = Depends(get_session),
):
    body = demo_account_fields(body)
    if session.exec(select(User).where(User.username == body.username)).first():
        return {"status": "failed", "error": "Username already taken"}

    user = User(
        username=body.username, password_hash=hash_password(body.password),
        first_name=body.first_name, last_name=body.last_name, email=body.email,
    )
    session.add(user)
    session.flush()

    restaurant = Restaurant(
        user_id=user.id, name=body.name, phone=body.phone, address=body.address, logo=body.logo,
    )
    session.add(restaurant)
    session.commit()
    session.refresh(restaurant)

    token = issue_access_token(session, user)
    return {"status": "success", "access_token": token}


@router.get("/me/")
def get_me(
    request: Request,
    restaurant: Restaurant = Depends(get_restaurant_from_bearer_token),
):
    return {"restaurant": serialize_restaurant(request, restaurant), "user": _serialize_user(restaurant.user)}


@router.put("/me/")
def update_me(
    body: RestaurantAccountUpdateRequest,
    request: Request,
    restaurant: Restaurant = Depends(get_restaurant_from_bearer_token),
    session: Session = Depends(get_session),
):
    body = demo_account_fields(body)
    user = restaurant.user
    user.first_name = body.first_name
    user.last_name = body.last_name
    user.email = body.email
    restaurant.name = body.name
    restaurant.phone = body.phone
    restaurant.address = body.address
    restaurant.logo = body.logo
    session.add(user)
    session.add(restaurant)
    session.commit()
    session.refresh(restaurant)

    return {"restaurant": serialize_restaurant(request, restaurant), "user": _serialize_user(user)}


@router.get("/meals/")
def list_meals(
    request: Request,
    restaurant: Restaurant = Depends(get_restaurant_from_bearer_token),
    session: Session = Depends(get_session),
):
    meals = session.exec(
        select(Meal).where(Meal.restaurant_id == restaurant.id).order_by(Meal.id.desc())
    ).all()
    return {"meals": [serialize_meal(request, m) for m in meals]}


@router.post("/meals/")
def create_meal(
    body: MealRequest,
    request: Request,
    restaurant: Restaurant = Depends(get_restaurant_from_bearer_token),
    session: Session = Depends(get_session),
):
    meal = Meal(restaurant_id=restaurant.id, name=body.name, short_description=body.short_description, image=body.image, price=body.price)
    session.add(meal)
    session.commit()
    session.refresh(meal)
    return {"meal": serialize_meal(request, meal)}


@router.get("/meals/{meal_id}")
def get_meal(
    meal_id: int,
    request: Request,
    restaurant: Restaurant = Depends(get_restaurant_from_bearer_token),
    session: Session = Depends(get_session),
):
    meal = session.exec(
        select(Meal).where(Meal.id == meal_id, Meal.restaurant_id == restaurant.id)
    ).first()
    if meal is None:
        return {"status": "failed", "error": "Meal not found"}
    return {"meal": serialize_meal(request, meal)}


@router.put("/meals/{meal_id}")
def update_meal(
    meal_id: int,
    body: MealRequest,
    request: Request,
    restaurant: Restaurant = Depends(get_restaurant_from_bearer_token),
    session: Session = Depends(get_session),
):
    meal = session.exec(
        select(Meal).where(Meal.id == meal_id, Meal.restaurant_id == restaurant.id)
    ).first()
    if meal is None:
        return {"status": "failed", "error": "Meal not found"}

    meal.name = body.name
    meal.short_description = body.short_description
    meal.image = body.image
    meal.price = body.price
    session.add(meal)
    session.commit()
    session.refresh(meal)
    return {"meal": serialize_meal(request, meal)}


@router.get("/orders/")
def list_orders(
    restaurant: Restaurant = Depends(get_restaurant_from_bearer_token),
    session: Session = Depends(get_session),
):
    orders = session.exec(
        select(Order).where(Order.restaurant_id == restaurant.id).order_by(Order.id.desc())
    ).all()
    return {"orders": [serialize_order(session, o) for o in orders]}


@router.patch("/orders/{order_id}")
def mark_order_ready(
    order_id: int,
    restaurant: Restaurant = Depends(get_restaurant_from_bearer_token),
    session: Session = Depends(get_session),
):
    order = session.exec(
        select(Order).where(Order.id == order_id, Order.restaurant_id == restaurant.id)
    ).first()
    if order and order.status == COOKING:
        order.status = READY
        session.add(order)
        session.commit()
        session.refresh(order)

    if order is None:
        return {"status": "failed", "error": "Order not found"}
    return {"order": serialize_order(session, order)}


@router.get("/report/")
def report(
    restaurant: Restaurant = Depends(get_restaurant_from_bearer_token),
    session: Session = Depends(get_session),
):
    today = datetime.now(timezone.utc)
    offset = today.weekday()
    week_days = [today + timedelta(days=i) for i in range(0 - offset, 7 - offset)]

    revenue = []
    order_counts = []
    for day in week_days:
        start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        delivered = session.exec(
            select(Order).where(
                Order.restaurant_id == restaurant.id,
                Order.status == DELIVERED,
                Order.created_at >= start,
                Order.created_at < end,
            )
        ).all()
        revenue.append(sum(o.total for o in delivered))
        order_counts.append(len(delivered))

    meals = session.exec(select(Meal).where(Meal.restaurant_id == restaurant.id)).all()
    meal_totals = []
    for meal in meals:
        total_qty = session.exec(
            select(func.coalesce(func.sum(OrderDetails.quantity), 0)).where(OrderDetails.meal_id == meal.id)
        ).one()
        meal_totals.append((meal.name, total_qty))
    meal_totals.sort(key=lambda t: t[1], reverse=True)
    meal_totals = meal_totals[:3]

    driver_rows = session.exec(
        select(Order.driver_id, func.count(Order.id))
        .where(Order.restaurant_id == restaurant.id, Order.driver_id.is_not(None))
        .group_by(Order.driver_id)
        .order_by(func.count(Order.id).desc())
        .limit(3)
    ).all()
    driver_totals = []
    for driver_id, count in driver_rows:
        driver = session.get(Driver, driver_id)
        driver_totals.append((driver.user.get_full_name(), count))

    return {
        "weekday_labels": [d.strftime("%a") for d in week_days],
        "revenue": revenue,
        "order_counts": order_counts,
        "meal_labels": [m[0] for m in meal_totals],
        "meal_data": [m[1] for m in meal_totals],
        "driver_labels": [d[0] for d in driver_totals],
        "driver_data": [d[1] for d in driver_totals],
    }


@router.get("/notifications/")
def notifications(
    since: Optional[str] = None,
    restaurant: Restaurant = Depends(get_restaurant_from_bearer_token),
    session: Session = Depends(get_session),
):
    try:
        since_dt = datetime.fromisoformat(since) if since else datetime.fromtimestamp(0, tz=timezone.utc)
    except ValueError:
        since_dt = datetime.fromtimestamp(0, tz=timezone.utc)

    count = len(session.exec(
        select(Order).where(Order.restaurant_id == restaurant.id, Order.created_at > since_dt)
    ).all())

    return {"notification": count}
