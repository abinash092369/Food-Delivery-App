-- eets database schema (MySQL 8+)
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  profile_image_url VARCHAR(500),
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason VARCHAR(500),
  role ENUM('CUSTOMER','VENDOR','DRIVER','ADMIN','SUPER_ADMIN') NOT NULL,
  google_id VARCHAR(120),
  fcm_token VARCHAR(500),
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_phone (phone)
);

CREATE TABLE restaurants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_id BIGINT NOT NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  cuisine_types JSON,
  cover_image_url VARCHAR(500),
  logo_url VARCHAR(500),
  address_line VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  lat DOUBLE,
  lng DOUBLE,
  is_open BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT FALSE,
  rejection_reason VARCHAR(500),
  fssai_license VARCHAR(50),
  gst_number VARCHAR(50),
  avg_rating DOUBLE DEFAULT 0,
  total_ratings INT DEFAULT 0,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  delivery_time_min INT DEFAULT 30,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  opening_time TIME,
  closing_time TIME,
  days_open JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  INDEX idx_restaurants_city (city),
  INDEX idx_restaurants_approved (is_approved, is_active),
  FULLTEXT INDEX ft_restaurants_name_desc (name, description)
);

CREATE TABLE menu_categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id BIGINT NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500),
  image_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE menu_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  is_veg BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_recommended BOOLEAN DEFAULT FALSE,
  total_orders INT DEFAULT 0,
  avg_rating DOUBLE DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
  FULLTEXT INDEX ft_items_name_desc (name, description)
);

CREATE TABLE menu_customization_groups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id BIGINT NOT NULL,
  name VARCHAR(120) NOT NULL,
  type ENUM('SINGLE','MULTI') NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

CREATE TABLE menu_customization_options (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT NOT NULL,
  name VARCHAR(120) NOT NULL,
  extra_price DECIMAL(10,2) DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES menu_customization_groups(id) ON DELETE CASCADE
);

CREATE TABLE addresses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  label ENUM('HOME','WORK','OTHER') DEFAULT 'HOME',
  address_line VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  lat DOUBLE,
  lng DOUBLE,
  is_default BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE coupons (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('PERCENTAGE','FLAT','FREE_DELIVERY','BOGO') NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  max_discount DECIMAL(10,2),
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  usage_limit_per_user INT DEFAULT 1,
  total_usage_limit INT,
  current_usage INT DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  applicable_restaurant_id BIGINT,
  created_by_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (applicable_restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE carts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  restaurant_id BIGINT,
  coupon_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);

CREATE TABLE cart_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cart_id BIGINT NOT NULL,
  menu_item_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  selected_options JSON,
  item_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  restaurant_id BIGINT NOT NULL,
  delivery_partner_id BIGINT,
  delivery_address_id BIGINT NOT NULL,
  coupon_id BIGINT,
  status ENUM('PLACED','ACCEPTED','PREPARING','PACKED','PICKED_UP','ON_THE_WAY','DELIVERED','CANCELLED','REFUNDED') NOT NULL,
  payment_method ENUM('RAZORPAY','UPI','COD','WALLET') NOT NULL,
  payment_status ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  special_instructions VARCHAR(500),
  estimated_delivery_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  cancellation_reason VARCHAR(500),
  admin_notes VARCHAR(1000),
  refund_amount DECIMAL(10,2),
  refund_reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (delivery_address_id) REFERENCES addresses(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_restaurant (restaurant_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at),
  INDEX idx_orders_razorpay_order_id (razorpay_order_id)
);

CREATE TABLE order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  menu_item_id BIGINT NOT NULL,
  name VARCHAR(180) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  selected_options JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE TABLE order_status_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  status VARCHAR(40) NOT NULL,
  changed_by_id BIGINT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_id) REFERENCES users(id)
);

CREATE TABLE delivery_partners (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  vehicle_type ENUM('BIKE','SCOOTER','BICYCLE'),
  vehicle_make VARCHAR(60),
  vehicle_model VARCHAR(60),
  vehicle_reg_number VARCHAR(30),
  aadhaar_front_url VARCHAR(500),
  aadhaar_back_url VARCHAR(500),
  license_url VARCHAR(500),
  rc_url VARCHAR(500),
  selfie_url VARCHAR(500),
  bank_account_number VARCHAR(40),
  bank_ifsc VARCHAR(20),
  upi_id VARCHAR(80),
  is_verified BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT FALSE,
  current_lat DOUBLE,
  current_lng DOUBLE,
  total_deliveries INT DEFAULT 0,
  avg_rating DOUBLE DEFAULT 0,
  total_ratings INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_dp_online (is_online, is_verified)
);

CREATE TABLE delivery_assignments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE,
  driver_id BIGINT NOT NULL,
  status ENUM('ASSIGNED','ACCEPTED','REJECTED','PICKED_UP','DELIVERED','CANCELLED') NOT NULL,
  assigned_at TIMESTAMP NULL,
  accepted_at TIMESTAMP NULL,
  picked_up_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  pickup_otp VARCHAR(6),
  delivery_otp VARCHAR(6),
  distance_km DOUBLE,
  earnings_amount DECIMAL(10,2),
  rejection_reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (driver_id) REFERENCES delivery_partners(id)
);

CREATE TABLE reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  restaurant_id BIGINT NOT NULL,
  rating TINYINT NOT NULL,
  review_text TEXT,
  images JSON,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE review_replies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  review_id BIGINT NOT NULL UNIQUE,
  vendor_id BIGINT NOT NULL,
  reply_text TEXT NOT NULL,
  replied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id),
  FOREIGN KEY (vendor_id) REFERENCES users(id)
);

CREATE TABLE coupon_usage (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  coupon_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  body VARCHAR(1000),
  type VARCHAR(50),
  reference_id BIGINT,
  is_read BOOLEAN DEFAULT FALSE,
  sent_via JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_notif_user_read (user_id, is_read)
);

CREATE TABLE fraud_flags (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  order_id BIGINT,
  flag_type VARCHAR(60) NOT NULL,
  risk_score TINYINT,
  details JSON,
  status ENUM('OPEN','DISMISSED','INVESTIGATED') DEFAULT 'OPEN',
  flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (reviewed_by_id) REFERENCES users(id)
);

CREATE TABLE payouts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recipient_id BIGINT NOT NULL,
  type ENUM('VENDOR','DRIVER') NOT NULL,
  period_start DATE,
  period_end DATE,
  total_orders INT,
  gross_amount DECIMAL(12,2),
  commission_rate DECIMAL(5,4),
  commission_amount DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  status ENUM('PENDING','PROCESSING','PAID') DEFAULT 'PENDING',
  paid_at TIMESTAMP NULL,
  transaction_ref VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE TABLE promotions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id BIGINT NOT NULL,
  type VARCHAR(40),
  value DECIMAL(10,2),
  min_order DECIMAL(10,2),
  applicable_to ENUM('ALL','CATEGORY','ITEM') DEFAULT 'ALL',
  applicable_id BIGINT,
  banner_url VARCHAR(500),
  usage_limit INT,
  current_usage INT DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE user_favorites (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type ENUM('RESTAURANT','ITEM') NOT NULL,
  reference_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fav (user_id, type, reference_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notification_preferences (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  push BOOLEAN DEFAULT TRUE,
  email BOOLEAN DEFAULT TRUE,
  sms BOOLEAN DEFAULT TRUE,
  order_updates BOOLEAN DEFAULT TRUE,
  promotions BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

SET FOREIGN_KEY_CHECKS=1;
