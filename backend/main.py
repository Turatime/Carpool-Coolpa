from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from app.models.base import engine, Base, get_db
from app.routes import auth, trips, bookings, wallet, reviews, vehicles

def ensure_schema_compatibility():
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)

    with engine.begin() as connection:
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        if "balance" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN balance FLOAT NOT NULL DEFAULT 0.0"))

        vehicle_columns = {column["name"] for column in inspector.get_columns("vehicles")}
        if "brand" not in vehicle_columns:
            connection.execute(text("ALTER TABLE vehicles ADD COLUMN brand VARCHAR NOT NULL DEFAULT ''"))
        if "created_at" not in vehicle_columns:
            connection.execute(text("ALTER TABLE vehicles ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"))

        trip_columns = {column["name"] for column in inspector.get_columns("trips")}
        if "vehicle_id" not in trip_columns:
            connection.execute(text("ALTER TABLE trips ADD COLUMN vehicle_id INTEGER"))

        if "car_brand" in trip_columns and "vehicle_id" in {column["name"] for column in inspect(engine).get_columns("trips")}:
            legacy_trips = connection.execute(text("""
                SELECT id, driver_id, car_brand, car_model, license_plate
                FROM trips
                WHERE vehicle_id IS NULL
            """)).fetchall()

            for trip in legacy_trips:
                brand = trip.car_brand or ""
                model = trip.car_model or ""
                plate_number = trip.license_plate or ""
                existing_vehicle = connection.execute(
                    text("""
                        SELECT id FROM vehicles
                        WHERE owner_id = :owner_id
                          AND brand = :brand
                          AND model = :model
                          AND plate_number = :plate_number
                        LIMIT 1
                    """),
                    {
                        "owner_id": trip.driver_id,
                        "brand": brand,
                        "model": model,
                        "plate_number": plate_number,
                    },
                ).fetchone()

                if existing_vehicle:
                    vehicle_id = existing_vehicle.id
                else:
                    inserted_vehicle = connection.execute(
                        text("""
                            INSERT INTO vehicles (owner_id, brand, model, plate_number)
                            VALUES (:owner_id, :brand, :model, :plate_number)
                        """),
                        {
                            "owner_id": trip.driver_id,
                            "brand": brand,
                            "model": model,
                            "plate_number": plate_number,
                        },
                    )
                    vehicle_id = inserted_vehicle.lastrowid

                connection.execute(
                    text("UPDATE trips SET vehicle_id = :vehicle_id WHERE id = :trip_id"),
                    {"vehicle_id": vehicle_id, "trip_id": trip.id},
                )

        review_columns = {column["name"] for column in inspector.get_columns("reviews")}
        if "booking_id" not in review_columns:
            connection.execute(text("ALTER TABLE reviews ADD COLUMN booking_id INTEGER"))
        if "driver_id" not in review_columns:
            connection.execute(text("ALTER TABLE reviews ADD COLUMN driver_id INTEGER"))

        table_names = set(inspector.get_table_names())
        if "payments" not in table_names:
            connection.execute(text("""
                CREATE TABLE payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    booking_id INTEGER NOT NULL,
                    payer_id INTEGER NOT NULL,
                    amount FLOAT NOT NULL,
                    payment_method VARCHAR DEFAULT 'wallet',
                    status VARCHAR DEFAULT 'paid',
                    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (booking_id) REFERENCES bookings(id),
                    FOREIGN KEY (payer_id) REFERENCES users(id)
                )
            """))
        if "wallet_transactions" not in table_names:
            connection.execute(text("""
                CREATE TABLE wallet_transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    transaction_type VARCHAR NOT NULL,
                    amount FLOAT NOT NULL,
                    reference_id INTEGER,
                    note VARCHAR,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """))

ensure_schema_compatibility()

app = FastAPI(title="Carpool-Coolpa API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(trips.router, prefix="/api/trips", tags=["Trips"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(wallet.router, prefix="/api/wallet", tags=["Wallet"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])

@app.get("/")
async def root():
    return {"message": "Welcome to Carpool-Coolpa API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
