from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from ..models.base import get_db
from ..models.schemas import Booking, Trip, User

router = APIRouter()


class BookingCreate(BaseModel):
    trip_id: int
    passenger_id: int
    seats_booked: int


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_booking(booking_data: BookingCreate, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == booking_data.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if trip.status != "active":
        raise HTTPException(status_code=400, detail="This trip is not available for booking")

    if trip.driver_id == booking_data.passenger_id:
        raise HTTPException(status_code=400, detail="Drivers cannot book their own trips")

    if booking_data.seats_booked <= 0:
        raise HTTPException(status_code=400, detail="Seats booked must be greater than 0")

    if trip.available_seats < booking_data.seats_booked:
        raise HTTPException(status_code=400, detail="Not enough seats available")

    passenger = db.query(User).filter(User.id == booking_data.passenger_id).first()
    if not passenger:
        raise HTTPException(status_code=404, detail="Passenger not found")

    total_price = trip.price_per_seat * booking_data.seats_booked

    if passenger.balance < total_price:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Required: {total_price}, Current: {passenger.balance}",
        )

    # Deduct balance immediately upon booking (escrow-like)
    passenger.balance -= total_price

    # DEDUCT SEATS IMMEDIATELY to prevent overbooking
    trip.available_seats -= booking_data.seats_booked

    new_booking = Booking(
        trip_id=booking_data.trip_id,
        passenger_id=booking_data.passenger_id,
        seats_booked=booking_data.seats_booked,
        total_price=total_price,
        status="paid",  # Starts as paid because balance is deducted
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


@router.get("/user/{user_id}")
def get_user_bookings(user_id: int, db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.passenger_id == user_id).all()
    results = []
    for b in bookings:
        trip = db.query(Trip).filter(Trip.id == b.trip_id).first()
        results.append(
            {
                "id": b.id,
                "trip": {
                    "id": trip.id,
                    "origin": trip.origin,
                    "destination": trip.destination,
                    "departure_time": trip.departure_time,
                    "price_per_seat": trip.price_per_seat,
                },
                "seats_booked": b.seats_booked,
                "total_price": b.total_price,
                "status": b.status,
                "created_at": b.created_at,
            }
        )
    return results


@router.get("/driver/{driver_id}")
def get_driver_bookings(driver_id: int, db: Session = Depends(get_db)):
    # Join with Trip to filter by driver_id
    bookings = db.query(Booking).join(Trip).filter(Trip.driver_id == driver_id).all()
    results = []
    for b in bookings:
        passenger = db.query(User).filter(User.id == b.passenger_id).first()
        trip = db.query(Trip).filter(Trip.id == b.trip_id).first()
        results.append(
            {
                "id": b.id,
                "trip": {
                    "id": trip.id,
                    "origin": trip.origin,
                    "destination": trip.destination,
                    "departure_time": trip.departure_time,
                },
                "passenger": {"id": passenger.id, "full_name": passenger.full_name},
                "seats_booked": b.seats_booked,
                "total_price": b.total_price,
                "status": b.status,
            }
        )
    return results


@router.get("/{booking_id}")
def get_booking_detail(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    trip = db.query(Trip).filter(Trip.id == booking.trip_id).first()
    driver = db.query(User).filter(User.id == trip.driver_id).first() if trip else None
    return {
        "id": booking.id,
        "trip": {
            "id": trip.id,
            "origin": trip.origin,
            "destination": trip.destination,
            "departure_time": trip.departure_time,
            "driver_id": trip.driver_id,
            "driver": {
                "id": driver.id,
                "full_name": driver.full_name,
            } if driver else None,
        },
        "seats_booked": booking.seats_booked,
        "total_price": booking.total_price,
        "status": booking.status,
        "created_at": booking.created_at,
    }


@router.put("/{booking_id}/confirm")
def confirm_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "paid":
        raise HTTPException(
            status_code=400, detail="Booking must be paid before confirmation"
        )

    booking.status = "confirmed"
    db.commit()
    return {"message": "Booking confirmed", "status": "confirmed"}


@router.put("/{booking_id}/cancel")
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == "cancelled":
        return {"message": "Already cancelled"}

    # Refund seats and money
    trip = db.query(Trip).filter(Trip.id == booking.trip_id).first()
    passenger = db.query(User).filter(User.id == booking.passenger_id).first()

    trip.available_seats += booking.seats_booked
    passenger.balance += booking.total_price

    booking.status = "cancelled"
    db.commit()
    return {"message": "Booking cancelled and refunded"}
