from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from sqlalchemy import func
from ..models.base import get_db
from ..models.schemas import Review, Booking, Trip, User

router = APIRouter()

class ReviewCreate(BaseModel):
    trip_id: int
    booking_id: int
    reviewer_id: int
    driver_id: int
    rating: int # 1-5
    comment: str = None

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_review(review_data: ReviewCreate, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == review_data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status != "confirmed": # Or completed
        raise HTTPException(status_code=400, detail="Trip must be confirmed/completed to leave a review")
    
    # Check if review already exists
    existing = db.query(Review).filter(Review.booking_id == review_data.booking_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Review already exists for this booking")
    
    trip = db.query(Trip).filter(Trip.id == booking.trip_id).first()
    
    new_review = Review(
        trip_id=booking.trip_id,
        booking_id=booking.id,
        reviewer_id=booking.passenger_id,
        driver_id=trip.driver_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

@router.get("/driver/{driver_id}")
def get_driver_reviews(driver_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.driver_id == driver_id).all()
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.driver_id == driver_id).scalar() or 0.0
    return {
        "reviews": reviews,
        "average_rating": round(float(avg_rating), 1),
        "total_reviews": len(reviews)
    }
