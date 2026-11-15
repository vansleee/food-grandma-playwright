import os

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.demo_security import public_demo, require_demo_admin, sanitize_demo_profiles
from app.database import get_session
from app.models import Order, COOKING
from app.seed import reset_demo_data
from app.dummy_data import rebuild_dummy_data

router = APIRouter()


@router.post("/api/test/reset", dependencies=[Depends(require_demo_admin)])
def test_reset(session: Session = Depends(get_session)):
    reset_demo_data(session)
    return {"status": "reset"}


@router.post("/api/test/seed", dependencies=[Depends(require_demo_admin)])
def test_seed(session: Session = Depends(get_session)):
    summary = rebuild_dummy_data(session)
    if public_demo():
        sanitize_demo_profiles(session)
    return {"status": "seeded", **summary,
            "restaurant_login": {"username": "admin", "password": "password@321"},
            "customer_access_token": "e2e-customer-token",
            "driver_access_token": "e2e-driver-token",
            "seeded_order_id": session.exec(select(Order).where(Order.status == COOKING).order_by(Order.id)).first().id, "seeded_order_status": "COOKING"}


def demo_enabled() -> bool:
    return os.environ.get("SEED_DEMO_DATA", "false").lower() == "true"


@router.get("/api/test/config")
def demo_config():
    return {"enabled": demo_enabled(), "admin_required": True, "public_demo": public_demo()}


@router.post("/api/test/rebuild", dependencies=[Depends(require_demo_admin)])
def rebuild(session: Session = Depends(get_session)):
    if not demo_enabled():
        raise HTTPException(status_code=403, detail="Demo rebuild is disabled")
    summary = rebuild_dummy_data(session)
    if public_demo():
        sanitize_demo_profiles(session)
    return {"status": "seeded", **summary}
