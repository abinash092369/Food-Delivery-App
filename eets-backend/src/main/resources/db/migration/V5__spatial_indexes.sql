-- V5: Add generated spatial column 'location' and spatial indexes for restaurants and delivery partners
ALTER TABLE restaurants ADD COLUMN location POINT GENERATED ALWAYS AS (POINT(COALESCE(lng, 0), COALESCE(lat, 0))) STORED NOT NULL;
CREATE SPATIAL INDEX idx_restaurants_location ON restaurants(location);

ALTER TABLE delivery_partners ADD COLUMN location POINT GENERATED ALWAYS AS (POINT(COALESCE(current_lng, 0), COALESCE(current_lat, 0))) STORED NOT NULL;
CREATE SPATIAL INDEX idx_dp_location ON delivery_partners(location);
