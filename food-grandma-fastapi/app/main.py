import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from sqlmodel import Session

from app.demo_security import public_demo, sanitize_demo_profiles
from app.database import create_db_and_tables, engine
from app.routers import customer, demo_data, driver, restaurant, social_auth
from app.dummy_data import initialize_demo_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    if os.environ.get("SEED_DEMO_DATA", "false").lower() == "true":
        with Session(engine) as session:
            initialize_demo_if_empty(session)
    if public_demo():
        with Session(engine) as session:
            sanitize_demo_profiles(session)
    yield


app = FastAPI(
    title="Food Grandma API",
    description="Food Grandma API for customer ordering, driver delivery, and restaurant management.",
    version="1.0.0",
    openapi_tags=[
        {"name": "restaurant", "description": "店家管理者的餐廳、餐點與訂單 API。"},
        {"name": "customer", "description": "顧客瀏覽餐廳、餐點及建立訂單的 API。"},
        {"name": "driver", "description": "外送員查詢、接取及配送訂單的 API。"},
        {"name": "auth", "description": "帳號認證與存取權杖 API。"},
        {"name": "test", "description": "本機及自動化測試使用的資料管理 API。"},
    ],
    lifespan=lifespan,
)

_default_origins = "http://localhost:8082,http://127.0.0.1:8082"
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ALLOWED_ORIGINS", _default_origins).split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(LookupError)
def lookup_error_handler(request: Request, exc: LookupError):
    return JSONResponse(status_code=401, content={"status": "failed", "error": str(exc)})


app.include_router(restaurant.router, tags=["restaurant"])
app.include_router(social_auth.router, tags=["auth"])
app.include_router(customer.router, tags=["customer"])
app.include_router(driver.router, tags=["driver"])
app.include_router(demo_data.router, tags=["test"])
