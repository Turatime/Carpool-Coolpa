# 🚗 Carpool-Coolpa

A simple and cool ride-sharing platform built with FastAPI (Python) and HTML/JS/CSS.

## 🌟 Features
- **Register & Login**: Join as a Passenger or Driver.
- **Find Trips**: Search for available carpool seats by origin and destination.
- **Create Trips**: Drivers can offer seats and set prices.
- **Bookings**: Passengers can reserve seats and track their bookings.

## 🛠️ Tech Stack
- **Backend**: FastAPI (Python 3.11)
- **Database**: SQLite (SQLAlchemy ORM)
- **Frontend**: HTML5, CSS3, JavaScript (Nginx)
- **Deployment**: Docker & Docker Compose

## 🚀 Quick Start with Docker

1. **Clone the project**
2. **Run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```
3. **Access the platform**:
   - Frontend: [http://localhost](http://localhost)
   - Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📁 Project Structure
- `backend/`: FastAPI application code.
- `frontend/`: Static HTML/JS/CSS files.
- `db/`: Database schema and initial seed data.
- `docker-compose.yml`: Main configuration to run all services.

## 📝 License
MIT
