-- Migration: add index on orders.created_at
CREATE INDEX idx_orders_created_at ON orders(created_at);
