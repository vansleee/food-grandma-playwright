"""Complete database fixtures for the local demo. Rebuilds are atomic."""
import json
import secrets
from datetime import datetime, timedelta, timezone
from collections import Counter
from sqlmodel import Session, select
from app.database import engine
from app.auth import hash_password
from app.models import User, Restaurant, Customer, Driver, Meal, Order, OrderDetails, COOKING, READY, ONTHEWAY, DELIVERED, STATUS_LABELS
CATALOG = [('山禾日式食堂', '台北市中山區示範路 10 號', [('照燒雞腿飯', 180, '炙烤雞腿搭配時蔬與白飯'), ('鹽烤鯖魚定食', 220, '鹽烤鯖魚、季節小菜與味噌湯'), ('野菜咖哩飯', 160, '多種蔬菜與日式咖哩'), ('味噌湯', 40, '豆腐、海帶與日式味噌')]), ('青日沙拉', '台北市大安區示範路 20 號', [('舒肥雞胸沙拉', 190, '雞胸、生菜與檸檬油醋'), ('烤南瓜藜麥碗', 170, '南瓜、藜麥與綜合蔬菜'), ('酪梨鮮蔬捲', 150, '酪梨、生菜與全麥餅皮'), ('無糖冷泡茶', 50, '清爽冷泡烏龍茶')]), ('巷口牛肉麵', '台北市信義區示範路 30 號', [('紅燒牛肉麵', 200, '慢燉牛肉與濃郁紅燒湯頭'), ('清燉牛肉麵', 200, '清燉湯頭搭配軟嫩牛肉'), ('麻醬乾麵', 90, '芝麻醬與小黃瓜絲'), ('涼拌小黃瓜', 45, '蒜香清脆小菜')]), ('暖暖義麵屋', '台北市松山區示範路 40 號', [('番茄肉醬義大利麵', 230, '番茄、牛肉醬與帕瑪森起司'), ('青醬野菇義大利麵', 210, '羅勒青醬與綜合菇類'), ('奶油培根義大利麵', 240, '奶油白醬、培根與黑胡椒'), ('蒜香麵包', 60, '香蒜奶油烤法國麵包')]), ('好晨早餐店', '台北市內湖區示範路 50 號', [('起司蛋餅', 65, '煎蛋與起司搭配酥香餅皮'), ('里肌蛋吐司', 85, '里肌肉、煎蛋與生菜'), ('薯餅蛋堡', 90, '金黃薯餅與煎蛋漢堡'), ('冰豆漿', 35, '早餐搭配的經典豆漿')])]

def add_dummy_catalog(session: Session):
    driver_user = session.exec(select(User).where(User.username == 'driver1')).one()
    driver = session.exec(select(Driver).where(Driver.user_id == driver_user.id)).one()
    now = datetime.now(timezone.utc)
    added = Counter()

    def user_for(key, name):
        user = session.exec(select(User).where(User.username == key)).first()
        if not user:
            user = User(username=key, password_hash=hash_password(secrets.token_urlsafe(32)), first_name=name, email=f'{key}@example.invalid')
            session.add(user)
            session.flush()
        return user
    for index, (name, address, menu) in enumerate(CATALOG):
        owner = user_for(f'dummy-owner-{index}', f'示範店主 {index + 1}')
        restaurant = session.exec(select(Restaurant).where(Restaurant.user_id == owner.id)).first()
        if not restaurant:
            restaurant = Restaurant(user_id=owner.id, name=name, phone='', address=address, logo='')
            session.add(restaurant)
            session.flush()
            added['restaurants'] += 1
        meals = []
        for title, price, description in menu:
            meal = session.exec(select(Meal).where(Meal.restaurant_id == restaurant.id, Meal.name == title)).first()
            if not meal:
                meal = Meal(restaurant_id=restaurant.id, name=title, price=price, short_description=description, image='')
                session.add(meal)
                session.flush()
                added['meals'] += 1
            meals.append(meal)
        for slot, status in enumerate([COOKING, READY, DELIVERED, DELIVERED]):
            user = user_for(f'dummy-customer-{index}-{slot}', f'示範顧客 {index + 1}-{slot + 1}')
            customer = session.exec(select(Customer).where(Customer.user_id == user.id)).first()
            if not customer:
                customer = Customer(user_id=user.id, address=f'台北市大安區示範巷 {index * 4 + slot + 1} 號 2 樓')
                session.add(customer)
                session.flush()
                added['customers'] += 1
            if session.exec(select(Order).where(Order.customer_id == customer.id)).first():
                continue
            created = now - timedelta(days=(index + slot) % (now.weekday() + 1), hours=0) if status == DELIVERED else now
            selected = [(meals[slot % 3], 1), (meals[3], 2)]
            total = sum((meal.price * quantity for meal, quantity in selected))
            order = Order(customer_id=customer.id, restaurant_id=restaurant.id, driver_id=driver.id if status == DELIVERED else None, address=customer.address, total=total, status=status, created_at=created, picked_at=created if status == DELIVERED else None)
            session.add(order)
            session.flush()
            for meal, quantity in selected:
                session.add(OrderDetails(order_id=order.id, meal_id=meal.id, quantity=quantity, sub_total=meal.price * quantity))
            added['orders'] += 1
    session.flush()
    orders = session.exec(select(Order)).all()
    for order in orders:
        details = session.exec(select(OrderDetails).where(OrderDetails.order_id == order.id)).all()
        if sum((d.sub_total for d in details)) != order.total:
            raise RuntimeError(f'Order {order.id} total mismatch; rolling back.')
    session.flush()
    return dict(added)
from datetime import datetime, timezone

def ensure_order_states(session: Session):
    owner = session.exec(select(User).where(User.username == 'admin')).one()
    restaurant = session.exec(select(Restaurant).where(Restaurant.user_id == owner.id)).one()
    driver_user = session.exec(select(User).where(User.username == 'driver1')).one()
    driver = session.exec(select(Driver).where(Driver.user_id == driver_user.id)).one()
    meal = session.exec(select(Meal).where(Meal.restaurant_id == restaurant.id).order_by(Meal.id)).first()
    if meal is None:
        raise RuntimeError('Demo restaurant has no meal; nothing changed.')
    result = []
    now = datetime.now(timezone.utc)
    for status in [COOKING, READY, ONTHEWAY, DELIVERED]:
        query = select(Order).where(Order.restaurant_id == restaurant.id, Order.status == status)
        if status in [ONTHEWAY, DELIVERED]:
            query = query.where(Order.driver_id == driver.id)
        if status == DELIVERED:
            from datetime import timedelta
            week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.where(Order.created_at >= week_start)
        if status == READY:
            query = query.where(Order.driver_id.is_(None))
        order = session.exec(query.order_by(Order.id)).first()
        created = order is None
        if created:
            user = User(username=f'demo-status-{status}-{secrets.token_hex(4)}', password_hash=hash_password(secrets.token_urlsafe(32)), first_name='Demo', last_name=STATUS_LABELS[status])
            session.add(user)
            session.flush()
            customer = Customer(user_id=user.id, address=f'{status + 10} Demo St, Taipei')
            session.add(customer)
            session.flush()
            order = Order(customer_id=customer.id, restaurant_id=restaurant.id, driver_id=driver.id if status in [ONTHEWAY, DELIVERED] else None, address=customer.address, total=meal.price * 2, status=status, created_at=now, picked_at=now if status in [ONTHEWAY, DELIVERED] else None)
            session.add(order)
            session.flush()
            session.add(OrderDetails(order_id=order.id, meal_id=meal.id, quantity=2, sub_total=order.total))
        result.append({'id': order.id, 'status': STATUS_LABELS[status], 'created': created})
    session.flush()
    return result
from app.models import Restaurant, Meal
PHOTO = {'salad': '1546069901-ba9599a7e63c', 'pizza': '1513104890138-7c749659a591', 'pasta': '1473093295043-cdd812d0e601', 'noodles': '1569718212165-3a8278d5f624', 'sandwich': '1528735602780-2552fd46c7af', 'bowl': '1540189549336-e6e99c3679fe', 'soup': '1547592166-23ac45744acd', 'vegetables': '1512621776951-a57141f2eefd', 'tea': '1544787219-7f47ccb76574', 'grill': '1555939594-58d7cb561ad1'}
COVERS = {'Pizza Palace': 'pizza', '山禾日式食堂': 'bowl', '青日沙拉': 'salad', '巷口牛肉麵': 'noodles', '暖暖義麵屋': 'pasta', '好晨早餐店': 'sandwich'}

def url(key):
    return f'https://images.unsplash.com/photo-{PHOTO[key]}?auto=format&fit=crop&w=900&q=85'

def meal_photo(name, default):
    for words, key in [('冷泡茶 豆漿', 'tea'), ('味噌湯', 'soup'), ('小黃瓜', 'vegetables'), ('雞腿 鯖魚', 'grill'), ('沙拉', 'salad'), ('藜麥 咖哩', 'bowl'), ('酪梨 捲 蛋餅 吐司 蛋堡 麵包', 'sandwich')]:
        if any((word in name for word in words.split())):
            return key
    return default

def add_food_photos(session: Session):
    counts = {'restaurants': 0, 'meals': 0}
    for restaurant in session.exec(select(Restaurant)).all():
        if restaurant.name not in COVERS:
            continue
        key = COVERS[restaurant.name]
        if not restaurant.logo or restaurant.logo == 'sample':
            restaurant.logo = url(key)
            session.add(restaurant)
            counts['restaurants'] += 1
        for meal in session.exec(select(Meal).where(Meal.restaurant_id == restaurant.id)).all():
            if not meal.image or meal.image == 'sample':
                meal.image = url(meal_photo(meal.name, key))
                session.add(meal)
                counts['meals'] += 1
    session.flush()
    return counts

def dataset_summary(session: Session) -> dict:
    return {'restaurants': len(session.exec(select(Restaurant)).all()), 'meals': len(session.exec(select(Meal)).all()), 'orders': len(session.exec(select(Order)).all()), 'order_states': dict(Counter((STATUS_LABELS[o.status] for o in session.exec(select(Order)).all())))}

def validate_dummy_data(session: Session) -> None:
    """Reject incomplete fixtures before committing the replacement database."""
    restaurants = session.exec(select(Restaurant)).all()
    meals = session.exec(select(Meal)).all()
    orders = session.exec(select(Order)).all()
    if not {COOKING, READY, ONTHEWAY, DELIVERED}.issubset({o.status for o in orders}):
        raise ValueError("Dummy data must include all four order states")
    if not restaurants or not meals:
        raise ValueError("Dummy catalog is empty")
    if any(not r.logo.startswith('https://images.unsplash.com/') for r in restaurants):
        raise ValueError("Every demo restaurant must have a real food photo")
    if any(not m.image.startswith('https://images.unsplash.com/') for m in meals):
        raise ValueError("Every demo meal must have a real food photo")
    for restaurant in restaurants:
        if not any(m.restaurant_id == restaurant.id for m in meals):
            raise ValueError("Every demo restaurant must have a menu")
    for order in orders:
        details = session.exec(select(OrderDetails).where(OrderDetails.order_id == order.id)).all()
        if not details or sum(d.sub_total for d in details) != order.total:
            raise ValueError("Every demo order must have consistent line items")
        if order.status in (ONTHEWAY, DELIVERED) and order.driver_id is None:
            raise ValueError("Delivery fixtures must have a driver")

def rebuild_dummy_data(session: Session) -> dict:
    """Replace demo data atomically, including catalog, photos, and all states."""
    from app.seed import reset_demo_data, seed_demo_data
    try:
        reset_demo_data(session, commit=False)
        seed_demo_data(session, commit=False)
        add_dummy_catalog(session)
        ensure_order_states(session)
        add_food_photos(session)
        validate_dummy_data(session)
        summary = dataset_summary(session)
        session.commit()
        return summary
    except Exception:
        session.rollback()
        raise

def initialize_demo_if_empty(session: Session) -> bool:
    """Never delete or replace an existing installation during startup."""
    if session.exec(select(User)).first() is not None:
        return False
    rebuild_dummy_data(session)
    return True
