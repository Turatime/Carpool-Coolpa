from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    phone = Column(String)
    role = Column(String, default="user")
    balance = Column(Float, default=0.0) # Wallet balance
    created_at = Column(DateTime, server_default=func.now())

    trips = relationship("Trip", back_populates="driver")
    bookings = relationship("Booking", back_populates="passenger")
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.driver_id", back_populates="driver")

class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"))
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure_time = Column(DateTime, nullable=False)
    total_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    price_per_seat = Column(Float, nullable=False)
    status = Column(String, default="active") # active, completed, cancelled
    created_at = Column(DateTime, server_default=func.now())

    driver = relationship("User", back_populates="trips")
    bookings = relationship("Booking", back_populates="trip")
    reviews = relationship("Review", back_populates="trip")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    passenger_id = Column(Integer, ForeignKey("users.id"))
    seats_booked = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="pending") # pending, paid, confirmed, cancelled, completed
    created_at = Column(DateTime, server_default=func.now())

    trip = relationship("Trip", back_populates="bookings")
    passenger = relationship("User", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    driver_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Integer, nullable=False) # 1-5
    comment = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    trip = relationship("Trip", back_populates="reviews")
    booking = relationship("Booking", back_populates="review")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    driver = relationship("User", foreign_keys=[driver_id], back_populates="reviews_received")
