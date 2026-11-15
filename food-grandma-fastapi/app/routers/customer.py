import json
import os
from typing import Optional

import stripe
from fastapi import APIRouter, Depends, Form, HTTPException, Request
from sqlmodel import Session, select

from app.auth import get_customer_from_form_token, get_customer_from_query_token
from app.demo_security import public_demo
from app.database import get_session
from app.models import COOKING, DELIVERED, Customer, Driver, Meal, ONTHEWAY, Order, OrderDetails, Restaurant
from app.serializers import serialize_meal, serialize_order, serialize_order_status, serialize_restaurant

stripe.api_key = os.environ.get("STRIPE_API_KEY", "YOUR_STRIPE_SECRET_KEY")

router = APIRouter()


@router.get("/api/customer/restaurants/")
def customer_get_restaurants(request: Request, session: Session = Depends(get_session)):
    restaurants = session.exec(select(Restaurant).order_by(Restaurant.id.desc())).all()
    return {"restaurants": [serialize_restaurant(request, r) for r in restaurants]}


@router.get("/api/customer/meals/{restaurant_id}")
def customer_get_meals(restaurant_id: int, request: Request, session: Session = Depends(get_session)):
    meals = session.exec(
        select(Meal).where(Meal.restaurant_id == restaurant_id).order_by(Meal.id.desc())
    ).all()
    return {"meals": [serialize_meal(request, m) for m in meals]}


@router.post("/api/customer/orders/")
def customer_add_order(
    restaurant_id: int = Form(...),
    address: str = Form(""),
    order_details: str = Form(...),
    customer: Customer = Depends(get_customer_from_form_token),
    session: Session = Depends(get_session),
):
    if public_demo():
        address = "網站示範地址（非真實配送地址）"
    outstanding = session.exec(
        select(Order).where(Order.customer_id == customer.id, Order.status != DELIVERED)
    ).first()
    if outstanding:
        return {"status": "failed", "error": "Your last order must be completed."}

    if not address:
        return {"status": "failed", "error": "Address is required"}

    details = json.loads(order_details)

    order_total = 0
    for item in details:
        meal = session.exec(
            select(Meal).where(Meal.id == item["meal_id"], Meal.restaurant_id == restaurant_id)
        ).first()
        if meal is None:
            return {"status": "failed", "error": "Meals must be in only one restaurant"}
        order_total += meal.price * item["quantity"]

    if len(details) == 0:
        return {}

    order = Order(
        customer_id=customer.id, restaurant_id=restaurant_id,
        total=order_total, status=COOKING, address=address,
    )
    session.add(order)
    session.flush()

    for item in details:
        meal = session.get(Meal, item["meal_id"])
        session.add(OrderDetails(
            order_id=order.id, meal_id=item["meal_id"],
            quantity=item["quantity"], sub_total=meal.price * item["quantity"],
        ))
    session.commit()

    return {"status": "success"}


@router.get("/api/customer/orders/latest")
def customer_get_latest_order(
    customer: Customer = Depends(get_customer_from_query_token),
    session: Session = Depends(get_session),
):
    order = session.exec(
        select(Order).where(Order.customer_id == customer.id).order_by(Order.id.desc())
    ).first()
    return {"last_order": serialize_order(session, order) if order else None}


@router.get("/api/customer/orders/latest/status")
def customer_get_latest_order_status(
    customer: Customer = Depends(get_customer_from_query_token),
    session: Session = Depends(get_session),
):
    order = session.exec(
        select(Order).where(Order.customer_id == customer.id).order_by(Order.id.desc())
    ).first()
    return {"last_order_status": serialize_order_status(order) if order else None}


@router.get("/api/customer/driver/location/")
def customer_get_driver_location(
    customer: Customer = Depends(get_customer_from_query_token),
    session: Session = Depends(get_session),
):
    current_order = session.exec(
        select(Order)
        .where(Order.customer_id == customer.id, Order.status == ONTHEWAY)
        .order_by(Order.id.desc())
    ).first()

    location: Optional[str] = None
    if current_order and current_order.driver_id:
        driver = session.get(Driver, current_order.driver_id)
        location = driver.location

    return {"location": location}


@router.post("/api/customer/payment_intent/")
def create_payment_intent(
    total: str = Form(...),
    customer: Customer = Depends(get_customer_from_form_token),
):
    if public_demo():
        raise HTTPException(status_code=403, detail="Payments are disabled in the public demo")
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(total) * 100,
            currency="aud",
            description="Food Grandma Order",
        )
        return {"client_secret": intent.client_secret}
    except stripe.error.StripeError as e:
        return {"status": "failed", "error": str(e)}
    except Exception as e:
        return {"status": "failed", "error": str(e)}
