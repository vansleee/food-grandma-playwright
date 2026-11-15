"""Create only fresh comparison accounts; tests arrange meals/orders through real APIs."""
from pathlib import Path
import json
import os

from sqlmodel import Session, select
from app.auth import hash_password
from app.database import create_db_and_tables, engine
from app.models import Customer, Driver, Restaurant, User

directory = Path(__file__).resolve().parent
password = os.environ['TEST_PASSWORD']
hashed = hash_password(password)
create_db_and_tables()
with Session(engine) as session:
    for case, actors in json.loads((directory / 'accounts.json').read_text()).items():
        for actor, username in actors.items():
            if session.exec(select(User).where(User.username == username)).first():
                raise RuntimeError('Comparison accounts already exist; use a fresh isolated database.')
            user = User(username=username, password_hash=hashed, first_name=actor,
                        last_name=case, email=f'{username}@example.invalid')
            session.add(user)
            session.flush()
            if actor.startswith('restaurant'):
                session.add(Restaurant(user_id=user.id, name=f'{case} {actor} 示範餐廳',
                                       address=f'{case} {actor} 示範路 1 號', phone='DEMO-PHONE', logo=''))
            elif actor.startswith('customer'):
                session.add(Customer(user_id=user.id, address=f'{case} {actor} 示範地址', phone='DEMO-PHONE', avatar=''))
            else:
                session.add(Driver(user_id=user.id, car_model='Demo', plate_number='DEMO-000', avatar=''))
    session.commit()
print('Created fresh comparison accounts. Meals and orders remain empty.')
