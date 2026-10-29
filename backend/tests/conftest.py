import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.db.init_db import init_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

@pytest.fixture(scope="function")
def db_session():
    """Provides an isolated clean in-memory database session for each test."""
    Base.metadata.create_all(bind=engine_test)
    session = TestingSessionLocal()
    try:
        # Seed initial sample data in the test db
        init_db(db=session)
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine_test)

@pytest.fixture(scope="function")
def client(db_session):
    """Test client overriding get_db dependency with test in-memory session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
