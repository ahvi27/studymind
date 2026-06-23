"""Basic API tests for StudyMind."""

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine, SessionLocal
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_register_and_login():
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com", "username": "testuser", "password": "testpass123"},
    )
    assert response.status_code == 201

    response = client.post(
        "/auth/login",
        data={"username": "test@example.com", "password": "testpass123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_protected_route_without_token():
    response = client.get("/notes/list")
    assert response.status_code == 401
