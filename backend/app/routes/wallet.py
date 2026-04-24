from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from ..models.base import get_db
from ..models.schemas import User, WalletTransaction

router = APIRouter()

class TopUpRequest(BaseModel):
    user_id: int
    amount: float


def serialize_wallet_transaction(transaction: WalletTransaction):
    return {
        "id": transaction.id,
        "transaction_type": transaction.transaction_type,
        "amount": transaction.amount,
        "reference_id": transaction.reference_id,
        "note": transaction.note,
        "created_at": transaction.created_at,
    }

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
    db.add(
        WalletTransaction(
            user_id=user.id,
            transaction_type="topup",
            amount=request.amount,
            note="Wallet top-up",
        )
    )
    db.commit()
    db.refresh(user)
    return {"message": "Top-up successful", "new_balance": user.balance}


@router.get("/history/{user_id}")
def get_wallet_history(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    transactions = db.query(WalletTransaction)\
        .filter(WalletTransaction.user_id == user_id)\
        .order_by(WalletTransaction.created_at.desc(), WalletTransaction.id.desc())\
        .limit(10)\
        .all()

    return [serialize_wallet_transaction(transaction) for transaction in transactions]
