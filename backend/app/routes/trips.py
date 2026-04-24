from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from ..models.base import get_db
from ..models.schemas import Trip, User, Review, Booking, Vehicle

router = APIRouter()

class TripCreate(BaseModel):
    driver_id: int
    origin: str
    destination: str
    vehicle_id: Optional[int] = None
    car_brand: Optional[str] = None
    car_model: Optional[str] = None
    license_plate: Optional[str] = None
    departure_time: datetime
    total_seats: int
    price_per_seat: float

class TripOut(BaseModel):
    id: int
    driver_id: int
    origin: str
    destination: str
    vehicle_id: int
    departure_time: datetime
    total_seats: int
    available_seats: int
    price_per_seat: float
    status: str
    booking_count: int
    can_cancel: bool
    driver: dict
    vehicle: dict

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


def build_trip_response(trip: Trip, driver: User, vehicle: Vehicle, db: Session):
    stats = get_driver_stats(driver.id, db)
    # Count only active bookings (exclude cancelled)
    booking_count = db.query(Booking).filter(
        Booking.trip_id == trip.id,
        Booking.status != "cancelled"
    ).count()
    vehicle_payload = {
        "id": vehicle.id if vehicle else None,
        "brand": vehicle.brand if vehicle else "",
        "model": vehicle.model if vehicle else "",
        "plate_number": vehicle.plate_number if vehicle else "",
        "color": vehicle.color if vehicle else "",
    }

    return {
        "id": trip.id,
        "driver_id": trip.driver_id,
        "origin": trip.origin,
        "destination": trip.destination,
        "vehicle_id": trip.vehicle_id,
        "departure_time": trip.departure_time,
        "total_seats": trip.total_seats,
        "available_seats": trip.available_seats,
        "price_per_seat": trip.price_per_seat,
        "status": trip.status,
        "booking_count": booking_count,
        "can_cancel": trip.status == "active" and booking_count == 0,
        "driver": {
            "id": driver.id,
            "full_name": driver.full_name,
            "phone": driver.phone,
            "rating": stats["rating"],
            "review_count": stats["review_count"],
            "trip_count": stats["trip_count"]
        },
        "vehicle": vehicle_payload
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
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        results.append(build_trip_response(trip, driver, vehicle, db))
    return results

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_trip(trip_data: TripCreate, db: Session = Depends(get_db)):
    driver = db.query(User).filter(User.id == trip_data.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    vehicle = None
    if trip_data.vehicle_id:
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == trip_data.vehicle_id,
            Vehicle.owner_id == trip_data.driver_id
        ).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found for this driver")
    else:
        if not trip_data.car_brand or not trip_data.car_model or not trip_data.license_plate:
            raise HTTPException(
                status_code=400,
                detail="Vehicle information is required"
            )

        vehicle = db.query(Vehicle).filter(
            Vehicle.owner_id == trip_data.driver_id,
            Vehicle.brand == trip_data.car_brand,
            Vehicle.model == trip_data.car_model,
            Vehicle.plate_number == trip_data.license_plate
        ).first()

        if not vehicle:
            vehicle = Vehicle(
                owner_id=trip_data.driver_id,
                brand=trip_data.car_brand,
                model=trip_data.car_model,
                plate_number=trip_data.license_plate
            )
            db.add(vehicle)
            db.flush()

    new_trip = Trip(
        driver_id=trip_data.driver_id,
        vehicle_id=vehicle.id,
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
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        results.append(build_trip_response(trip, driver, vehicle, db))
    return results


@router.put("/{trip_id}/cancel")
def cancel_trip(trip_id: int, driver_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.driver_id != driver_id:
        raise HTTPException(status_code=403, detail="You can only cancel your own trip")

    if trip.status == "cancelled":
        return {"message": "Trip already cancelled", "status": "cancelled"}

    # Count only active bookings (exclude cancelled)
    booking_count = db.query(Booking).filter(
        Booking.trip_id == trip.id,
        Booking.status != "cancelled"
    ).count()
    if booking_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel this trip because it already has active bookings"
        )

    trip.status = "cancelled"
    db.commit()
    return {"message": "Trip cancelled", "status": "cancelled"}
