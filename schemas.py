from pydantic import BaseModel
from datetime import date

class FinanceBase(BaseModel):
    name: str
    salary: float
    expenses: float
    description: str | None = None
    category: str
    date: date

class FinanceCreate(FinanceBase):
    pass

class FinanceResponse(FinanceBase):
    id: int
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class BudgetBase(BaseModel):
    month: int
    year: int
    amount: float

class BudgetCreate(BudgetBase):
    pass

class BudgetResponse(BudgetBase):
    id: int
    class Config:
        from_attributes = True
