# 🚗 RideShare — Carpool Application

A full-stack carpool application built with **Node.js + Express** (backend) and **React + Tailwind CSS** (frontend), backed by **MySQL**.

---

## 📁 Folder Structure

```
carpool/
├── backend/
│   ├── db/
│   │   ├── connection.js       # MySQL connection pool
│   │   └── schema.sql          # Full SQL schema with PK/FK
│   ├── middleware/
│   │   └── auth.js             # JWT auth + role guards
│   ├── routes/
│   │   ├── auth.js             # POST /register, POST /login
│   │   ├── vehicles.js         # POST /vehicles, GET /vehicles
│   │   ├── trips.js            # POST /trips, GET /trips, GET /trips/:id
│   │   ├── bookings.js         # POST /bookings, GET /bookings, DELETE /bookings/:id
│   │   ├── payments.js         # POST /payments
│   │   └── reviews.js          # POST /reviews, GET /trips/:id/reviews
│   ├── server.js               # Express entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js        # Axios instance with auto-auth header
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── StarRating.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Global auth state + JWT storage
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Trips.jsx       # Search + Book trips
│   │   │   ├── CreateTrip.jsx  # Driver: post a trip
│   │   │   ├── Vehicles.jsx    # Driver: manage vehicles
│   │   │   ├── Bookings.jsx    # Passenger: view bookings
│   │   │   ├── Payment.jsx     # Pay for a booking
│   │   │   └── Review.jsx      # Submit + view reviews
│   │   ├── App.jsx             # Routes + protected routes
│   │   ├── index.js
│   │   └── index.css           # Tailwind + custom classes
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## ⚙️ Prerequisites

- Node.js v18+
- MySQL 8+
- npm

---

## 🗄️ 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run the schema
source /path/to/carpool/backend/db/schema.sql
# OR:
mysql -u root -p < backend/db/schema.sql
```

---

## 🔧 2. Backend Setup

```bash
cd carpool/backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env:
#   DB_HOST=localhost
#   DB_USER=root
#   DB_PASSWORD=yourpassword
#   DB_NAME=carpool_db
#   JWT_SECRET=any_long_random_string

# Start the server
npm run dev        # development (nodemon)
# OR
npm start          # production
```

Backend runs at: **http://localhost:5000**

---

## 💻 3. Frontend Setup

```bash
cd carpool/frontend

# Install dependencies
npm install

# Start React dev server
npm start
```

Frontend runs at: **http://localhost:3000**

> The `"proxy": "http://localhost:5000"` in `package.json` forwards `/api` calls to the backend automatically.

---

## 🔌 API Reference

| Method | Endpoint               | Auth     | Description                     |
|--------|------------------------|----------|---------------------------------|
| POST   | /api/auth/register     | —        | Register new user               |
| POST   | /api/auth/login        | —        | Login, returns JWT              |
| POST   | /api/vehicles          | Driver   | Add a vehicle                   |
| GET    | /api/vehicles          | Driver   | List own vehicles               |
| POST   | /api/trips             | Driver   | Create a trip                   |
| GET    | /api/trips             | Public   | List active trips (search)      |
| GET    | /api/trips/:id         | Public   | Single trip with driver rating  |
| POST   | /api/bookings          | Passenger| Book a trip (auto-deducts seats)|
| GET    | /api/bookings          | Auth     | My bookings                     |
| DELETE | /api/bookings/:id      | Passenger| Cancel booking (restores seats) |
| POST   | /api/payments          | Passenger| Complete payment                |
| POST   | /api/reviews           | Passenger| Submit review (paid only)       |
| GET    | /api/trips/:id/reviews | Public   | Get reviews + average rating    |

---

## ✅ Key Business Rules Implemented

| Rule | Where |
|------|-------|
| JWT-based auth with role guards | `middleware/auth.js` |
| Prevent overbooking (DB transaction + row lock) | `routes/bookings.js` |
| Auto-deduct seats on booking | `routes/bookings.js` |
| Restore seats on cancellation | `routes/bookings.js` |
| Auto-create pending payment on booking | `routes/bookings.js` |
| Only review after payment is paid | `routes/reviews.js` |
| One review per passenger per trip | DB UNIQUE constraint + code check |
| Driver's average rating shown on trips | SQL AVG in `routes/trips.js` |
| Drivers cannot book own trips | `routes/bookings.js` |

---

## 👤 Test Accounts (after seeding)

Register manually via the UI or API:

```bash
# Register a driver
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Driver","email":"alice@test.com","password":"123456","role":"driver","phone":"0812345678"}'

# Register a passenger
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob Passenger","email":"bob@test.com","password":"123456","role":"passenger"}'
```
