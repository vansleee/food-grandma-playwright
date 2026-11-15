from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    first_name: str = ""
    last_name: str = ""
    email: str = ""

    def get_full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class Restaurant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    name: str
    phone: str
    address: str
    logo: str = ""

    user: Optional[User] = Relationship()


class Customer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    avatar: str = ""
    phone: str = ""
    address: str = ""

    user: Optional[User] = Relationship()


class Driver(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    avatar: str = ""
    car_model: str = ""
    plate_number: str = ""
    location: str = ""

    user: Optional[User] = Relationship()


class Meal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    restaurant_id: int = Field(foreign_key="restaurant.id")
    name: str
    short_description: str = ""
    image: str = ""
    price: int = 0


# Order status constants — mirrors Django's Order.COOKING/READY/ONTHEWAY/DELIVERED
COOKING = 1
READY = 2
ONTHEWAY = 3
DELIVERED = 4

STATUS_LABELS = {
    COOKING: "Cooking",
    READY: "Ready",
    ONTHEWAY: "On the way",
    DELIVERED: "Delivered",
}


class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id")
    restaurant_id: int = Field(foreign_key="restaurant.id")
    driver_id: Optional[int] = Field(default=None, foreign_key="driver.id")
    address: str
    total: int
    status: int
    created_at: datetime = Field(default_factory=utcnow)
    picked_at: Optional[datetime] = None

    def status_display(self) -> str:
        return STATUS_LABELS[self.status]


class OrderDetails(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id")
    meal_id: int = Field(foreign_key="meal.id")
    quantity: int
    sub_total: int


class AccessToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(index=True, unique=True)
    user_id: int = Field(foreign_key="user.id")
    expires: datetime
