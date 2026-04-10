from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    sessions = relationship("SessionRecord", back_populates="owner", cascade="all, delete-orphan")

class SessionRecord(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    filename = Column(String)
    file_meta = Column(JSON) # To store shape, columns, preview, pdf_info roughly
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    owner = relationship("User", back_populates="sessions")
    messages = relationship("MessageRecord", back_populates="session", cascade="all, delete-orphan")

class MessageRecord(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    role = Column(String) # "user" or "assistant"
    content = Column(Text)
    charts = Column(JSON, nullable=True) # list of dicts
    plotly_json = Column(JSON, nullable=True)
    code = Column(Text, nullable=True)
    report = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("SessionRecord", back_populates="messages")
