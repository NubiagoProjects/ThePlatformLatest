-- Payment System Migration for Yellow Card Integration
-- Supports Mobile Money, Crypto Collection, and Stablecoin Management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for payment system
CREATE TYPE payment_method_type AS ENUM (
    'MOBILE_MONEY', 
    'BANK_TRANSFER', 
    'CRYPTO', 
    'CARD', 
    'YELLOWCARD'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PROCESSING', 
    'COMPLETED', 
    'FAILED', 
    'CANCELLED', 
    'EXPIRED',
    'REFUNDED'
);

CREATE TYPE transaction_type AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL', 
    'PURCHASE', 
    'REFUND', 
    'CONVERSION',
    'TRANSFER'
);

CREATE TYPE currency_type AS ENUM (
    'USD', 'EUR', 'GBP', 'NGN', 'KES', 'UGX', 'TZS', 'GHS', 'ZAR',
    'USDT', 'USDC', 'BUSD', 'DAI', 'BTC', 'ETH'
);

CREATE TYPE mobile_money_provider AS ENUM (
    'MTN_MOMO', 'VODAFONE_CASH', 'TIGO_CASH', 'AIRTEL_MONEY',
    'MPESA', 'ORANGE_MONEY', 'MOOV_MONEY', 'WAVE', 'FLOOZ'
);

-- Countries table for regional support
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code CHAR(2) UNIQUE NOT NULL, -- ISO 3166-1 alpha-2
    name TEXT NOT NULL,
    currency currency_type NOT NULL,
    is_supported BOOLEAN DEFAULT true,
    mobile_money_providers mobile_money_provider[],
    yellowcard_supported BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment methods configuration
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type payment_method_type NOT NULL,
    provider TEXT NOT NULL, -- e.g., 'yellowcard', 'mtn', 'mpesa'
    country_code CHAR(2) REFERENCES countries(code),
    is_active BOOLEAN DEFAULT true,
    min_amount DECIMAL(20,8) DEFAULT 0,
    max_amount DECIMAL(20,8),
    fee_percentage DECIMAL(5,2) DEFAULT 0,
    fee_fixed DECIMAL(20,8) DEFAULT 0,
    processing_time_minutes INTEGER DEFAULT 15,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User wallets for multi-currency support
CREATE TABLE user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency currency_type NOT NULL,
    balance DECIMAL(20,8) DEFAULT 0 CHECK (balance >= 0),
    locked_balance DECIMAL(20,8) DEFAULT 0 CHECK (locked_balance >= 0),
    yellowcard_wallet_id TEXT, -- External wallet ID from Yellow Card
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Payment intents for transaction tracking
CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
    currency currency_type NOT NULL,
    target_currency currency_type, -- For conversions
    target_amount DECIMAL(20,8), -- Converted amount
    payment_method_id UUID REFERENCES payment_methods(id),
    provider_transaction_id TEXT, -- External provider transaction ID
    yellowcard_payment_id TEXT, -- Yellow Card specific ID
    status payment_status DEFAULT 'PENDING',
    type transaction_type NOT NULL,
    description TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    customer_name TEXT,
    country_code CHAR(2) REFERENCES countries(code),
    provider_fees DECIMAL(20,8) DEFAULT 0,
    platform_fees DECIMAL(20,8) DEFAULT 0,
    exchange_rate DECIMAL(20,8), -- For crypto conversions
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction history for audit trail
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_id UUID REFERENCES user_wallets(id),
    payment_intent_id UUID REFERENCES payment_intents(id),
    type transaction_type NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency currency_type NOT NULL,
    balance_before DECIMAL(20,8) NOT NULL,
    balance_after DECIMAL(20,8) NOT NULL,
    description TEXT,
    reference TEXT UNIQUE,
    provider_reference TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Yellow Card integration logs
CREATE TABLE yellowcard_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id UUID REFERENCES payment_intents(id),
    action TEXT NOT NULL, -- 'create_payment', 'check_status', 'webhook'
    request_data JSONB,
    response_data JSONB,
    status_code INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment webhooks for provider callbacks
CREATE TABLE payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payment_intent_id UUID REFERENCES payment_intents(id),
    raw_payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exchange rates for currency conversion
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency currency_type NOT NULL,
    to_currency currency_type NOT NULL,
    rate DECIMAL(20,8) NOT NULL CHECK (rate > 0),
    provider TEXT DEFAULT 'yellowcard',
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_currency, to_currency, provider)
);

-- User payment profiles for saved information
CREATE TABLE user_payment_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
    profile_name TEXT NOT NULL,
    phone_number TEXT,
    account_number TEXT,
    account_name TEXT,
    provider_user_id TEXT, -- External provider user ID
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_payment_intents_created_at ON payment_intents(created_at);
CREATE INDEX idx_payment_intents_provider_id ON payment_intents(provider_transaction_id);
CREATE INDEX idx_payment_intents_yellowcard_id ON payment_intents(yellowcard_payment_id);

CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_user_wallets_currency ON user_wallets(currency);
CREATE INDEX idx_user_wallets_active ON user_wallets(is_active);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference);

CREATE INDEX idx_payment_methods_type ON payment_methods(type);
CREATE INDEX idx_payment_methods_country ON payment_methods(country_code);
CREATE INDEX idx_payment_methods_active ON payment_methods(is_active);

CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_valid ON exchange_rates(valid_until);

CREATE INDEX idx_yellowcard_logs_payment_intent ON yellowcard_logs(payment_intent_id);
CREATE INDEX idx_yellowcard_logs_created_at ON yellowcard_logs(created_at);

CREATE INDEX idx_payment_webhooks_provider ON payment_webhooks(provider);
CREATE INDEX idx_payment_webhooks_processed ON payment_webhooks(processed);

-- Enable Row Level Security
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yellowcard_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Countries (public read)
CREATE POLICY "Anyone can view supported countries" ON countries
    FOR SELECT USING (is_supported = true);

-- Payment methods (public read for active methods)
CREATE POLICY "Anyone can view active payment methods" ON payment_methods
    FOR SELECT USING (is_active = true);

-- User wallets (users can only access their own wallets)
CREATE POLICY "Users can view their own wallets" ON user_wallets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own wallets" ON user_wallets
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can manage wallets" ON user_wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Payment intents (users can only access their own)
CREATE POLICY "Users can view their own payment intents" ON payment_intents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own payment intents" ON payment_intents
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own payment intents" ON payment_intents
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payment intents" ON payment_intents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Transactions (users can only view their own)
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Exchange rates (public read)
CREATE POLICY "Anyone can view current exchange rates" ON exchange_rates
    FOR SELECT USING (valid_until > NOW());

-- User payment profiles (users can only access their own)
CREATE POLICY "Users can manage their own payment profiles" ON user_payment_profiles
    FOR ALL USING (user_id = auth.uid());

-- Yellow Card logs (admin only)
CREATE POLICY "Admins can view yellowcard logs" ON yellowcard_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Payment webhooks (system only)
CREATE POLICY "System can manage payment webhooks" ON payment_webhooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Functions and triggers

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update wallet balance based on transaction
    UPDATE user_wallets 
    SET 
        balance = NEW.balance_after,
        updated_at = NOW()
    WHERE id = NEW.wallet_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update wallet balance after transaction
CREATE TRIGGER update_wallet_balance_trigger 
    AFTER INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

-- Function to generate transaction reference
CREATE OR REPLACE FUNCTION generate_transaction_reference()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TXN-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || FLOOR(RANDOM() * 10000)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to lock wallet funds
CREATE OR REPLACE FUNCTION lock_wallet_funds(
    p_wallet_id UUID,
    p_amount DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL;
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance
    FROM user_wallets
    WHERE id = p_wallet_id;
    
    -- Check if sufficient funds
    IF current_balance < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Lock the funds
    UPDATE user_wallets
    SET 
        balance = balance - p_amount,
        locked_balance = locked_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_wallet_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to unlock wallet funds
CREATE OR REPLACE FUNCTION unlock_wallet_funds(
    p_wallet_id UUID,
    p_amount DECIMAL,
    p_return_to_balance BOOLEAN DEFAULT TRUE
) RETURNS BOOLEAN AS $$
BEGIN
    IF p_return_to_balance THEN
        -- Return funds to available balance
        UPDATE user_wallets
        SET 
            balance = balance + p_amount,
            locked_balance = locked_balance - p_amount,
            updated_at = NOW()
        WHERE id = p_wallet_id AND locked_balance >= p_amount;
    ELSE
        -- Remove funds completely (for successful payments)
        UPDATE user_wallets
        SET 
            locked_balance = locked_balance - p_amount,
            updated_at = NOW()
        WHERE id = p_wallet_id AND locked_balance >= p_amount;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure single default payment profile
CREATE OR REPLACE FUNCTION ensure_single_default_payment_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE user_payment_profiles 
        SET is_default = false 
        WHERE user_id = NEW.user_id AND payment_method_id = NEW.payment_method_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_payment_profile_trigger 
    BEFORE INSERT OR UPDATE ON user_payment_profiles
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_payment_profile();

-- Trigger for updated_at timestamps
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_payment_profiles_updated_at BEFORE UPDATE ON user_payment_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- African countries with Mobile Money support
INSERT INTO countries (code, name, currency, mobile_money_providers, yellowcard_supported) VALUES
    ('NG', 'Nigeria', 'NGN', ARRAY['MTN_MOMO', 'AIRTEL_MONEY']::mobile_money_provider[], true),
    ('KE', 'Kenya', 'KES', ARRAY['MPESA', 'AIRTEL_MONEY']::mobile_money_provider[], true),
    ('UG', 'Uganda', 'UGX', ARRAY['MTN_MOMO', 'AIRTEL_MONEY']::mobile_money_provider[], true),
    ('TZ', 'Tanzania', 'TZS', ARRAY['VODAFONE_CASH', 'TIGO_CASH', 'AIRTEL_MONEY']::mobile_money_provider[], true),
    ('GH', 'Ghana', 'GHS', ARRAY['MTN_MOMO', 'VODAFONE_CASH', 'AIRTEL_MONEY']::mobile_money_provider[], true),
    ('ZA', 'South Africa', 'ZAR', ARRAY[]::mobile_money_provider[], true),
    ('CI', 'Côte d''Ivoire', 'XOF', ARRAY['ORANGE_MONEY', 'MTN_MOMO', 'MOOV_MONEY']::mobile_money_provider[], false),
    ('SN', 'Senegal', 'XOF', ARRAY['ORANGE_MONEY', 'WAVE', 'FLOOZ']::mobile_money_provider[], false);

-- Payment methods
INSERT INTO payment_methods (name, type, provider, country_code, min_amount, max_amount, fee_percentage, processing_time_minutes) VALUES
    ('Yellow Card', 'YELLOWCARD', 'yellowcard', 'NG', 1000, 5000000, 1.5, 15),
    ('Yellow Card', 'YELLOWCARD', 'yellowcard', 'KE', 100, 500000, 1.5, 15),
    ('Yellow Card', 'YELLOWCARD', 'yellowcard', 'UG', 3000, 18000000, 1.5, 15),
    ('Yellow Card', 'YELLOWCARD', 'yellowcard', 'TZ', 2000, 11000000, 1.5, 15),
    ('Yellow Card', 'YELLOWCARD', 'yellowcard', 'GH', 500, 2500000, 1.5, 15),
    ('MTN Mobile Money', 'MOBILE_MONEY', 'mtn_momo', 'NG', 100, 2000000, 0.5, 5),
    ('M-Pesa', 'MOBILE_MONEY', 'mpesa', 'KE', 50, 1000000, 0.3, 5),
    ('MTN Mobile Money', 'MOBILE_MONEY', 'mtn_momo', 'UG', 500, 5000000, 0.5, 5),
    ('Airtel Money', 'MOBILE_MONEY', 'airtel_money', 'NG', 100, 1500000, 0.4, 5);

-- Sample exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, valid_until) VALUES
    ('NGN', 'USDT', 0.0024, NOW() + INTERVAL '1 hour'),
    ('KES', 'USDT', 0.0067, NOW() + INTERVAL '1 hour'),
    ('UGX', 'USDT', 0.00027, NOW() + INTERVAL '1 hour'),
    ('USDT', 'NGN', 415.50, NOW() + INTERVAL '1 hour'),
    ('USDT', 'KES', 149.20, NOW() + INTERVAL '1 hour'),
    ('USDT', 'UGX', 3700.00, NOW() + INTERVAL '1 hour');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON countries, payment_methods, exchange_rates TO anon; 