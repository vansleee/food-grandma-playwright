"""Model-layer sanity checks — mirrors the spirit of Django's coreapp/test_models.py."""

from app.models import COOKING, ONTHEWAY, Order, OrderDetails


def test_restaurant_user_relationship(restaurant):
    assert restaurant.user.get_full_name() == "Res Owner"
    assert restaurant.name == "Pizza House"


def test_customer_full_name(customer):
    assert customer.user.get_full_name() == "Cathy Customer"


def test_driver_full_name(driver):
    assert driver.user.get_full_name() == "Dan Driver"


def test_meal_belongs_to_restaurant(meal, restaurant):
    assert meal.restaurant_id == restaurant.id
    assert meal.price == 10


def test_order_status_display(db_session, customer, restaurant):
    order = Order(customer_id=customer.id, restaurant_id=restaurant.id, total=20, status=ONTHEWAY, address="Taipei")
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    assert order.status_display() == "On the way"
    assert order.picked_at is None


def test_order_details_relation(db_session, customer, restaurant, meal):
    order = Order(customer_id=customer.id, restaurant_id=restaurant.id, total=20, status=COOKING, address="Taipei")
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    detail = OrderDetails(order_id=order.id, meal_id=meal.id, quantity=2, sub_total=20)
    db_session.add(detail)
    db_session.commit()
    db_session.refresh(detail)

    assert detail.order_id == order.id
    assert detail.sub_total == 20
