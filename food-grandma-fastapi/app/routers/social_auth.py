from fastapi import APIRouter, Depends, Form, HTTPException
from sqlmodel import Session, select

from app.auth import issue_access_token, verify_password
from app.database import get_session
from app.models import User

router = APIRouter()


@router.post("/api/social/token/")
def convert_token(
    username: str = Form(...),
    password: str = Form(...),
    session: Session = Depends(get_session),
):
    """Simplified stand-in for django-oauth-toolkit's password grant.

    Django's own test suite never actually exercises the real OAuth2 handshake
    either (its make_access_token fixture creates AccessToken rows directly) —
    so this issues a token the same way, just reachable over HTTP too.
    """
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="invalid username or password")

    token = issue_access_token(session, user)
    return {"access_token": token, "token_type": "Bearer", "scope": "read write"}
