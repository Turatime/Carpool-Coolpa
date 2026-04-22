from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..models.base import get_db
from ..models.schemas import User

router = APIRouter()

class TopUpRequest(BaseModel):
    user_id: int
    amount: float

@router.get("/{user_id}")
def get_balance(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"balance": user.balance}

@router.post("/topup")
def top_up(request: TopUpRequest, db: Session = Depends(get_db)):
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.balance += request.amount
    db.commit()
    db.refresh(user)
    return {"message": "Top-up successful", "new_balance": user.balance}
