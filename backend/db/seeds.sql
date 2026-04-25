-- Seed data for Carpool-Coolpa
-- Password for all seed users: "password123" (hashed value should be used in production)

-- Insert Users
INSERT INTO users (full_name, email, password, phone, role, balance) VALUES 
('Anan Kaewchai', 'anan@example.com', '$2b$12$0nzpcy8Yu8n99gCKWzoa5ee.CjIojrBvVIBP2Z0HGv6dkEFdEDK', '+66 81 234 5678', 'driver', 0.0),
('Somchai Panyarat', 'somchai@example.com', '$2b$12$0nzpcy8Yu8n99gCKWzoa5ee.CjIojrBvVIBP2Z0HGv6dkEFdEDK', '+66 82 345 6789', 'driver', 0.0),
('Alice Wonderland', 'alice@example.com', '$2b$12$0nzpcy8Yu8n99gCKWzoa5ee.CjIojrBvVIBP2Z0HGv6dkEFdEDK', '+66 83 456 7890', 'passenger', 1000.0);

-- Insert Vehicles
INSERT INTO vehicles (owner_id, brand, model, plate_number, color) VALUES 
(1, 'Toyota', 'Camry', 'กข 1234', 'White'),
(2, 'Honda', 'Civic', 'ชญ 5678', 'Black');

-- Insert Trips
INSERT INTO trips (driver_id, vehicle_id, origin, destination, departure_time, total_seats, available_seats, price_per_seat, status) VALUES 
(1, 1, 'Bangkok', 'Chiang Mai', '2026-05-24 07:00:00', 4, 3, 350.0, 'active'),
(2, 2, 'Bangkok', 'Chiang Mai', '2026-05-24 09:30:00', 4, 2, 320.0, 'active'),
(1, 1, 'Phuket', 'Bangkok', '2026-06-01 10:00:00', 4, 4, 500.0, 'active');

-- Insert Bookings
INSERT INTO bookings (trip_id, passenger_id, seats_booked, total_price, status) VALUES 
(1, 3, 1, 350.0, 'confirmed'),
(2, 3, 2, 640.0, 'confirmed');

-- Insert Reviews
INSERT INTO reviews (trip_id, booking_id, reviewer_id, reviewee_id, rating, comment) VALUES 
(1, 1, 3, 1, 5, 'Great driver, very punctual!'),
(2, 2, 3, 2, 4, 'Smooth ride, but arrived a bit late.');
