from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from ..models.base import get_db
from ..models.schemas import Trip, User, Review, Booking

router = APIRouter()

class TripCreate(BaseModel):
    driver_id: int
    origin: str
    destination: str
    departure_time: datetime
    total_seats: int
    price_per_seat: float

class TripOut(BaseModel):
    id: int
    driver_id: int
    origin: str
    destination: str
    departure_time: datetime
    total_seats: int
    available_seats: int
    price_per_seat: float
    status: str
    driver: dict

    class Config:
        from_attributes = True

def get_driver_stats(driver_id: int, db: Session):
    # Calculate real rating
    rating_data = db.query(
        func.avg(Review.rating).label('avg_rating'),
        func.count(Review.id).label('review_count')
    ).join(Booking, Review.booking_id == Booking.id)\
     .join(Trip, Booking.trip_id == Trip.id)\
     .filter(Trip.driver_id == driver_id).first()
    
    # Count real completed trips
    trip_count = db.query(Trip).filter(Trip.driver_id == driver_id).count()
    
    avg_rating = round(float(rating_data.avg_rating), 1) if rating_data.avg_rating else 0
    review_count = int(rating_data.review_count) if rating_data.review_count else 0
    
    return {
        "rating": avg_rating,
        "review_count": review_count,
        "trip_count": trip_count
    }

@router.get("/", response_model=List[TripOut])
def get_trips(origin: Optional[str] = None, destination: Optional[str] = None, user_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Trip).filter(
        Trip.status == "active",
        Trip.available_seats > 0 )

    if user_id:
        query = query.filter(Trip.driver_id != user_id)

    if origin:
        query = query.filter(Trip.origin.ilike(f"%{origin}%"))

    if destination:
        query = query.filter(Trip.destination.ilike(f"%{destination}%"))
    
    trips = query.all()
    results = []
    for trip in trips:
        driver = db.query(User).filter(User.id == trip.driver_id).first()
        stats = get_driver_stats(driver.id, db)
        
        results.append({
            "id": trip.id,
            "driver_id": trip.driver_id,
            "origin": trip.origin,
            "destination": trip.destination,
            "departure_time": trip.departure_time,
            "total_seats": trip.total_seats,
            "available_seats": trip.available_seats,
            "price_per_seat": trip.price_per_seat,
            "status": trip.status,
            "driver": {
                "id": driver.id, 
                "full_name": driver.full_name,
                "rating": stats["rating"],
                "review_count": stats["review_count"],
                "trip_count": stats["trip_count"]
            }
        })
    return results

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_trip(trip_data: TripCreate, db: Session = Depends(get_db)):
    new_trip = Trip(
        driver_id=trip_data.driver_id,
        origin=trip_data.origin,
        destination=trip_data.destination,
        departure_time=trip_data.departure_time,
        total_seats=trip_data.total_seats,
        available_seats=trip_data.total_seats,
        price_per_seat=trip_data.price_per_seat,
        status="active"
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip

@router.get("/user/{user_id}", response_model=List[TripOut])
def get_user_trips(user_id: int, db: Session = Depends(get_db)):
    trips = db.query(Trip).filter(Trip.driver_id == user_id).all()
    results = []
    for trip in trips:
        driver = db.query(User).filter(User.id == trip.driver_id).first()
        stats = get_driver_stats(driver.id, db)
        
        results.append({
            "id": trip.id,
            "driver_id": trip.driver_id,
            "origin": trip.origin,
            "destination": trip.destination,
            "departure_time": trip.departure_time,
            "total_seats": trip.total_seats,
            "available_seats": trip.available_seats,
            "price_per_seat": trip.price_per_seat,
            "status": trip.status,
            "driver": {
                "id": driver.id, 
                "full_name": driver.full_name,
                "rating": stats["rating"],
                "review_count": stats["review_count"],
                "trip_count": stats["trip_count"]
            }
        })
    return results
