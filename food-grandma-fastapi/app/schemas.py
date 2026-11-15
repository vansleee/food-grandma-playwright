from pydantic import BaseModel


class RestaurantSignUpRequest(BaseModel):
    username: str
    password: str
    first_name: str = ""
    last_name: str = ""
    email: str
    name: str
    phone: str
    address: str
    logo: str = ""


class RestaurantAccountUpdateRequest(BaseModel):
    first_name: str = ""
    last_name: str = ""
    email: str
    name: str
    phone: str
    address: str
    logo: str = ""


class MealRequest(BaseModel):
    name: str
    short_description: str = ""
    image: str = ""
    price: int = 0
