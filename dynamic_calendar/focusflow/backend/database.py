"""
Database setup and utilities for FocusFlow.
Uses SQLite with SQLAlchemy for persistence.
"""

import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from config import settings

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# Create engine
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# ============================================================
# Database Models
# TODO: Person B - Expand these models as needed
# ============================================================

class Activity(Base):
    """Stores individual activity records from the extension."""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String, index=True)
    url = Column(String)
    domain = Column(String, index=True)
    title = Column(String)
    duration_ms = Column(Integer)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class Session(Base):
    """Stores work session summaries."""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String, index=True)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    focus_score = Column(Float)
    tab_switches = Column(Integer)
    total_duration_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


class Prediction(Base):
    """Stores prediction history for accuracy tracking."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    task_category = Column(String, index=True)
    predicted_minutes = Column(Integer)
    actual_minutes = Column(Integer, nullable=True)
    conservativity = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class Setting(Base):
    """Key-value store for user settings."""
    __tablename__ = "settings"

    key = Column(String, primary_key=True)
    value = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================
# Database Utilities
# ============================================================

def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)

    # Initialize default settings
    db = SessionLocal()
    try:
        if not db.query(Setting).filter(Setting.key == "conservativity").first():
            db.add(Setting(key="conservativity", value="0.5"))
        if not db.query(Setting).filter(Setting.key == "tracked_sites").first():
            db.add(Setting(key="tracked_sites", value="[]"))
        db.commit()
    finally:
        db.close()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
