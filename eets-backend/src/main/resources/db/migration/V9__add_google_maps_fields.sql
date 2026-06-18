-- Migration V9: Add Google Maps, geofencing, routing, scoring, and history tracking fields

ALTER TABLE delivery_assignments ADD COLUMN route_polyline TEXT;
ALTER TABLE delivery_assignments ADD COLUMN estimated_duration_min INT;
ALTER TABLE delivery_assignments ADD COLUMN route_distance_km DOUBLE;
ALTER TABLE delivery_assignments ADD COLUMN route_generated_at TIMESTAMP NULL;

ALTER TABLE restaurants ADD COLUMN delivery_radius_km DOUBLE DEFAULT 5.0;

ALTER TABLE delivery_partners ADD COLUMN operating_radius_km DOUBLE DEFAULT 10.0;
ALTER TABLE delivery_partners ADD COLUMN acceptance_rate DOUBLE DEFAULT 1.0;
ALTER TABLE delivery_partners ADD COLUMN completion_rate DOUBLE DEFAULT 1.0;

CREATE TABLE driver_location_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_id BIGINT NULL,
    FOREIGN KEY (driver_id) REFERENCES delivery_partners(id) ON DELETE CASCADE
);
