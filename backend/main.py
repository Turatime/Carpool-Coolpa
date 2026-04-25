from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os
from app.models.base import engine, Base
from app.config import settings
from app.routes import auth, trips, bookings, wallet, reviews, vehicles

# Create database tables from SQLAlchemy models
Base.metadata.create_all(bind=engine)

def seed_database():
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    
    # Check if 'users' table has data
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users;")
        user_count = cursor.fetchone()[0]
        conn.close()
        
        if user_count == 0:
            print("Database is empty. Seeding data from seeds.sql...")
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            seed_file_path = os.path.join(os.path.dirname(__file__), "db", "seeds.sql")
            with open(seed_file_path, "r") as f:
                sql_script = f.read()
                cursor.executescript(sql_script)
            conn.commit()
            conn.close()
            print("Database seeded successfully.")
        else:
            print("Database already contains data, skipping seeding.")
    except Exception as e:
        print(f"Seeding skipped or failed: {e}")

seed_database()

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
