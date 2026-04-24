from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from ..models.base import get_db
from ..models.schemas import User, Vehicle, Trip

router = APIRouter()


class VehicleCreate(BaseModel):
    owner_id: int
    brand: str
    model: str
    plate_number: str
    color: str = None


class VehicleOut(BaseModel):
    id: int
    owner_id: int
    brand: str
    model: str
    plate_number: str
    color: str = None

    class Config:
        from_attributes = True


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, owner_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id,
        Vehicle.owner_id == owner_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    trip_using_vehicle = db.query(Trip).filter(Trip.vehicle_id == vehicle_id).first()
    if trip_using_vehicle:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this vehicle because it is already used in a trip"
        )

    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted"}


@router.get("/user/{user_id}", response_model=List[VehicleOut])
def get_user_vehicles(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return db.query(Vehicle).filter(Vehicle.owner_id == user_id).order_by(Vehicle.id.desc()).all()


@router.post("/", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle_data: VehicleCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == vehicle_data.owner_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_vehicle = db.query(Vehicle).filter(
        Vehicle.owner_id == vehicle_data.owner_id,
        Vehicle.brand == vehicle_data.brand,
        Vehicle.model == vehicle_data.model,
        Vehicle.plate_number == vehicle_data.plate_number
    ).first()
    if existing_vehicle:
        return existing_vehicle

    vehicle = Vehicle(
        owner_id=vehicle_data.owner_id,
        brand=vehicle_data.brand,
        model=vehicle_data.model,
        plate_number=vehicle_data.plate_number,
        color=vehicle_data.color
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle
