-- ============================================================
-- CARPOOL APPLICATION DATABASE SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS carpool_db;
USE carpool_db;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
  user_id   INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  email     VARCHAR(150) NOT NULL UNIQUE,
  password  VARCHAR(255) NOT NULL,
  role      ENUM('driver','passenger') NOT NULL DEFAULT 'passenger',
  phone     VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- VEHICLES TABLE
-- ============================================================
CREATE TABLE vehicles (
  vehicle_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  model         VARCHAR(100) NOT NULL,
  capacity      INT NOT NULL CHECK (capacity > 0),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- TRIPS TABLE
-- ============================================================
CREATE TABLE trips (
  trip_id         INT AUTO_INCREMENT PRIMARY KEY,
  driver_id       INT NOT NULL,
  vehicle_id      INT,
  origin          VARCHAR(255) NOT NULL,
  destination     VARCHAR(255) NOT NULL,
  departure_time  DATETIME NOT NULL,
  available_seats INT NOT NULL CHECK (available_seats >= 0),
  price           DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  status          ENUM('active','completed','cancelled') DEFAULT 'active',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE SET NULL
);

-- ============================================================
-- BOOKINGS TABLE
-- ============================================================
CREATE TABLE bookings (
  booking_id   INT AUTO_INCREMENT PRIMARY KEY,
  trip_id      INT NOT NULL,
  passenger_id INT NOT NULL,
  seats_booked INT NOT NULL CHECK (seats_booked > 0),
  status       ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id)      REFERENCES trips(trip_id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE payments (
  payment_id     INT AUTO_INCREMENT PRIMARY KEY,
  booking_id     INT NOT NULL UNIQUE,
  amount         DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
  paid_at        DATETIME,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
CREATE TABLE reviews (
  review_id   INT AUTO_INCREMENT PRIMARY KEY,
  trip_id     INT NOT NULL,
  reviewer_id INT NOT NULL,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_review (trip_id, reviewer_id),
  FOREIGN KEY (trip_id)     REFERENCES trips(trip_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE
);
