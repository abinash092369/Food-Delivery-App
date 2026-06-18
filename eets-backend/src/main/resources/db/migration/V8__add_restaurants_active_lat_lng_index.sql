-- Migration: add composite index on (is_active, lat, lng) for restaurants
CREATE INDEX idx_restaurants_active_lat_lng ON restaurants(is_active, lat, lng);
