from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from sqlalchemy import func
from ..models.base import get_db
from ..models.schemas import Review, Booking, Trip, User

router = APIRouter()

from typing import Optional

class ReviewCreate(BaseModel):
    trip_id: int
    booking_id: int
    reviewer_id: int
    reviewee_id: int
    rating: int # 1-5
    comment: Optional[str] = None

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_review(review_input: dict, db: Session = Depends(get_db)):
    print(f"DEBUG: Received review data: {review_input}")
    
    # ดึงข้อมูลจาก dict แทน Pydantic เพื่อความยืดหยุ่นในการดีบัก
    booking_id = review_input.get("booking_id")
    rating = review_input.get("rating")
    comment = review_input.get("comment")
    reviewee_id = review_input.get("reviewee_id")
    
    if not booking_id:
        raise HTTPException(status_code=422, detail="Missing booking_id")

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status != "confirmed": # Or completed
        raise HTTPException(status_code=400, detail="Trip must be confirmed/completed to leave a review")
    
    # Check if review already exists
    existing = db.query(Review).filter(Review.booking_id == booking_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Review already exists for this booking")
    
    trip = db.query(Trip).filter(Trip.id == booking.trip_id).first()
    
    new_review = Review(
        trip_id=booking.trip_id,
        booking_id=booking.id,
        reviewer_id=booking.passenger_id,
        reviewee_id=reviewee_id or trip.driver_id,
        rating=rating,
        comment=comment
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

@router.get("/reviewee/{reviewee_id}")
def get_reviewee_reviews(reviewee_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.reviewee_id == reviewee_id).all()
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.reviewee_id == reviewee_id).scalar() or 0.0
    return {
        "reviews": reviews,
        "average_rating": round(float(avg_rating), 1),
        "total_reviews": len(reviews)
    }
