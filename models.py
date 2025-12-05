from sqlalchemy import Integer, String, Float, Date
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import datetime

class Finance(Base):
    __tablename__ = "finance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String)
    salary: Mapped[float] = mapped_column(Float)
    expenses: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(String, nullable=True)
    category: Mapped[str] = mapped_column(String)
    date: Mapped[datetime.date] = mapped_column(Date)

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)

class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    month: Mapped[int] = mapped_column(Integer)
    year: Mapped[int] = mapped_column(Integer)
    amount: Mapped[float] = mapped_column(Float)
    user_id: Mapped[int] = mapped_column(Integer, nullable=True)