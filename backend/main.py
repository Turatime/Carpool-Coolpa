from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from app.models.base import engine, Base, get_db
from app.routes import auth, trips, bookings, wallet, reviews

# Create database tables (in case they don't exist)
Base.metadata.create_all(bind=engine)


def ensure_trip_vehicle_columns():
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("trips")}
    missing_columns = {
        "car_brand": "ALTER TABLE trips ADD COLUMN car_brand VARCHAR NOT NULL DEFAULT ''",
        "car_model": "ALTER TABLE trips ADD COLUMN car_model VARCHAR NOT NULL DEFAULT ''",
        "license_plate": "ALTER TABLE trips ADD COLUMN license_plate VARCHAR NOT NULL DEFAULT ''",
    }

    with engine.begin() as connection:
        for name, ddl in missing_columns.items():
            if name not in columns:
                connection.execute(text(ddl))


ensure_trip_vehicle_columns()

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
