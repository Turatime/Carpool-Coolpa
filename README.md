# 🚗 Carpool-Coolpa

A simple and cool ride-sharing platform built with FastAPI (Python) and HTML/JS/CSS.

## 🌟 Features

1. 👤 **User**
   - **Login / Register** – Access the platform by creating an account or logging in  
   - **My Car** – Manage vehicle information (for drivers)

2. 🚗 **Trip**
   - **Search Trips** – Find available trips by origin and destination  
   - **Create Trips** – Drivers can create trips and set travel details  
   - **Book Trips** – Passengers can reserve seats  
   - **Confirm Booking** – Drivers approve booking requests  
   - **Cancel Booking** – Cancel existing bookings  

3. 💰 **Wallet**
   - **Top-up** – Add balance to the wallet  
   - **Review** – Rate and review after trips  
   - **Transaction History** – View past transactions  
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
