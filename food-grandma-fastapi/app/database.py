import os

from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./data/food-grandma.db")
_is_memory = DATABASE_URL in ("sqlite:///:memory:", "sqlite://")

if DATABASE_URL.startswith("sqlite:///") and not _is_memory:
    db_path = DATABASE_URL.removeprefix("sqlite:///")
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

engine_kwargs = {}
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
if _is_memory:
    engine_kwargs["poolclass"] = StaticPool

engine = create_engine(DATABASE_URL, connect_args=connect_args, **engine_kwargs)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
