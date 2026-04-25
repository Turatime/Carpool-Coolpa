from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    phone = Column(String)
    balance = Column(Float, nullable=False, default=0.0) # Wallet balance
    role = Column(String, default='passenger') # เพิ่ม column role
    created_at = Column(DateTime, server_default=func.now())

    vehicles = relationship("Vehicle", back_populates="owner")
    trips = relationship("Trip", back_populates="driver")
    bookings = relationship("Booking", back_populates="passenger")
    payments = relationship("Payment", back_populates="payer")
    wallet_transactions = relationship("WalletTransaction", back_populates="user")
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")


class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    plate_number = Column(String, nullable=False)
    color = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="vehicles")
    trips = relationship("Trip", back_populates="vehicle")

class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure_time = Column(DateTime, nullable=False)
    total_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    price_per_seat = Column(Float, nullable=False)
    status = Column(String, default="active") # active, completed, cancelled
    created_at = Column(DateTime, server_default=func.now())

    driver = relationship("User", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")
    bookings = relationship("Booking", back_populates="trip")
    reviews = relationship("Review", back_populates="trip")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    passenger_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seats_booked = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="pending") # pending, paid, confirmed, cancelled, completed
    created_at = Column(DateTime, server_default=func.now())

    trip = relationship("Trip", back_populates="bookings")
    passenger = relationship("User", back_populates="bookings")
    payments = relationship("Payment", back_populates="booking")
    review = relationship("Review", back_populates="booking", uselist=False)


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    payer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, default="wallet")
    status = Column(String, default="paid")  # pending, paid, refunded, failed
    paid_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

    booking = relationship("Booking", back_populates="payments")
    payer = relationship("User", back_populates="payments")


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_type = Column(String, nullable=False)  # topup, booking_payment, refund
    amount = Column(Float, nullable=False)
    reference_id = Column(Integer)
    note = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="wallet_transactions")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, CheckConstraint('rating >= 1 AND rating <= 5'), nullable=False) # 1-5
    comment = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    trip = relationship("Trip", back_populates="reviews")
    booking = relationship("Booking", back_populates="review")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewee = relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")
