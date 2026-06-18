-- Add index on razorpay_order_id for fast payment callback lookup
ALTER TABLE orders ADD INDEX idx_orders_razorpay_order_id (razorpay_order_id);
