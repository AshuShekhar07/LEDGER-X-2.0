from models import Finance, User, Budget
from schemas import FinanceCreate, UserCreate, BudgetCreate
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from passlib.context import CryptContext
from datetime import date
import calendar

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create(db: Session, data: FinanceCreate, user_id: int):
    finance = Finance(**data.model_dump(), user_id=user_id)
    db.add(finance)
    db.commit()
    db.refresh(finance)
    return finance

def get(db: Session, user_id: int, category: str | None = None):
    query = db.query(Finance).filter(Finance.user_id == user_id)
    if category:
        query = query.filter(Finance.category == category)
    return query.all()

def update(db: Session, id: int, data: FinanceCreate, user_id: int):
    finance = db.query(Finance).filter(Finance.id == id, Finance.user_id == user_id).first()
    if finance:
        for key, value in data.model_dump().items():
            setattr(finance, key, value)
        db.commit()
        db.refresh(finance)
    return finance

def delete(db: Session, id: int, user_id: int):
    finance = db.query(Finance).filter(Finance.id == id, Finance.user_id == user_id).first()
    if finance:
        db.delete(finance)
        db.commit()
        return True
    return False

def get_monthly_summary(db: Session, month: int, year: int, user_id: int):
    # Calculate start and end date of the month
    _, last_day = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)
    
    transactions = db.query(Finance).filter(
        Finance.user_id == user_id,
        Finance.date >= start_date,
        Finance.date <= end_date
    ).all()
    
    income = sum(t.salary for t in transactions)
    expenses = sum(t.expenses for t in transactions)
    
    return {
        "month": month,
        "year": year,
        "income": income,
        "expenses": expenses,
        "balance": income - expenses
    }

def get_category_expenses(db: Session, month: int, year: int, user_id: int):
    # Calculate start and end date of the month
    _, last_day = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)
    
    results = db.query(
        Finance.category,
        func.sum(Finance.expenses).label('total')
    ).filter(
        Finance.user_id == user_id,
        Finance.date >= start_date,
        Finance.date <= end_date,
        Finance.expenses > 0
    ).group_by(Finance.category).all()
    
    return [{"category": r[0], "amount": r[1]} for r in results]

def create_budget(db: Session, budget: BudgetCreate, user_id: int):
    # Check if budget exists for this month/year
    existing = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == budget.month,
        Budget.year == budget.year
    ).first()
    
    if existing:
        existing.amount = budget.amount
        db.commit()
        db.refresh(existing)
        return existing
    
    db_budget = Budget(**budget.model_dump(), user_id=user_id)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

def get_budget(db: Session, month: int, year: int, user_id: int):
    return db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == month,
        Budget.year == year
    ).first()

def get_daily_spending(db: Session, month: int, year: int, user_id: int):
    _, last_day = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)
    
    results = db.query(
        Finance.date,
        func.sum(Finance.expenses).label('total')
    ).filter(
        Finance.user_id == user_id,
        Finance.date >= start_date,
        Finance.date <= end_date,
        Finance.expenses > 0
    ).group_by(Finance.date).all()
    
    # Fill in missing days with 0
    daily_data = {}
    for r in results:
        daily_data[r[0]] = r[1]
        
    final_data = []
    for day in range(1, last_day + 1):
        current_date = date(year, month, day)
        final_data.append({
            "date": current_date,
            "amount": daily_data.get(current_date, 0)
        })
        
    return final_data

def get_yearly_expenses(db: Session, year: int, user_id: int):
    results = db.query(
        extract('month', Finance.date).label('month'),
        func.sum(Finance.expenses).label('total')
    ).filter(
        Finance.user_id == user_id,
        extract('year', Finance.date) == year,
        Finance.expenses > 0
    ).group_by('month').all()
    
    monthly_data = {r[0]: r[1] for r in results}
    
    final_data = []
    for month in range(1, 13):
        final_data.append({
            "month": calendar.month_name[month],
            "amount": monthly_data.get(month, 0)
        })
        
    return final_data

def get_yearly_spending_trend(db: Session, user_id: int):
    results = db.query(
        extract('year', Finance.date).label('year'),
        func.sum(Finance.expenses).label('total')
    ).filter(
        Finance.user_id == user_id,
        Finance.expenses > 0
    ).group_by('year').order_by('year').all()
    
    return [{"year": int(r[0]), "amount": r[1]} for r in results]