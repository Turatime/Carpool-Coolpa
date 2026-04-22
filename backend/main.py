from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.models.base import engine, Base, get_db
from app.routes import auth, trips, bookings, wallet, reviews

# Create database tables (in case they don't exist)
Base.metadata.create_all(bind=engine)

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
