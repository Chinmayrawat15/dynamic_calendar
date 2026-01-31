from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, JSON, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json
import os

DATABASE_URL = "sqlite:///./focusflow.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String, nullable=True)
    domain = Column(String, index=True)
    title = Column(String, nullable=True) # Privacy: handled in logic, but schema supports it
    duration_ms = Column(Integer)
    focus_score = Column(Float)
    tab_switches = Column(Integer)
    category = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    total_duration_ms = Column(Integer, default=0)
    session_count = Column(Integer, default=0)
    avg_focus_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    task_category = Column(String)
    predicted_ms = Column(Integer)
    actual_ms = Column(Integer, nullable=True)
    conservativity = Column(Float)
    was_accurate = Column(Boolean, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    conservativity = Column(Float, default=0.5)
    tracked_sites = Column(JSON, default=list)

# Default Categories for logic (not stored in DB unless needed, but useful for initialization)
CATEGORIES = {
    "coding": ["github.com", "stackoverflow.com", "leetcode.com"],
    "writing": ["docs.google.com", "notion.so", "medium.com"],
    "research": ["scholar.google.com", "arxiv.org", "wikipedia.org"],
    "distraction": ["youtube.com", "reddit.com", "twitter.com", "instagram.com"]
}

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed default settings
    db = SessionLocal()
    try:
        settings = db.query(Settings).filter(Settings.id == 1).first()
        if not settings:
            default_sites = []
            for cat, sites in CATEGORIES.items():
                default_sites.extend(sites)
            
            # De-duplicate just in case
            default_sites = list(set(default_sites))
            
            new_settings = Settings(id=1, conservativity=0.5, tracked_sites=default_sites)
            db.add(new_settings)
            db.commit()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
