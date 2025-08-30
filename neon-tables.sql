-- Neon Database Tables Schema for Shein TO YOU Dashboard
-- This script creates the necessary tables and initial data

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- In production, this should be hashed
    role TEXT NOT NULL DEFAULT 'user', -- super_admin, marketing, logistics, treasurer
    is_active BOOLEAN NOT NULL DEFAULT true,
    avatar TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create clients table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    buying_price DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    cart TEXT,
    advance_paid BOOLEAN DEFAULT false,
    remaining_paid BOOLEAN DEFAULT false,
    advance_amount DECIMAL(10, 2) DEFAULT 0,
    remaining_amount DECIMAL(10, 2) DEFAULT 0,
    profit_margin DECIMAL(10, 2) DEFAULT 0,
    total_profit DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Create payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_type TEXT NOT NULL, -- 'advance' or 'remaining'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Create settings table
CREATE TABLE settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    initialized BOOLEAN DEFAULT true,
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data
-- First, the default settings
INSERT INTO settings (initialized, version) VALUES (true, '1.0.0');

-- Insert default admin user
-- Password is 'AdminPassword123!' (should be hashed in production)
INSERT INTO users (full_name, email, password, role, is_active)
VALUES (
    'Super Administrator',
    'admin@sheintoyou.com',
    'AdminPassword123!',
    'super_admin',
    true
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_created_by ON clients(created_by);
CREATE INDEX idx_payments_client_id ON payments(client_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some test data
INSERT INTO clients (full_name, phone, address, buying_price, selling_price, cart, advance_paid, remaining_paid, advance_amount, remaining_amount)
VALUES
    ('Test Client 1', '+21612345678', 'Tunis, Tunisia', 50.00, 100.00, 'Test Product 1', true, false, 30.00, 70.00),
    ('Test Client 2', '+21687654321', 'Sfax, Tunisia', 75.00, 150.00, 'Test Product 2', false, true, 45.00, 105.00),
    ('Test Client 3', '+21655555555', 'Sousse, Tunisia', 40.00, 80.00, 'Test Product 3', true, true, 24.00, 56.00);

-- Insert some payment records
INSERT INTO payments (client_id, amount, payment_type, created_by)
VALUES
    (1, 30.00, 'advance', 1),
    (2, 105.00, 'remaining', 1),
    (3, 24.00, 'advance', 1),
    (3, 56.00, 'remaining', 1);