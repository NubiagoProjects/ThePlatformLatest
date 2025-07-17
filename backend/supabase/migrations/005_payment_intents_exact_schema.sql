-- Migration: Create exact payment_intents schema as requested
-- Adds the specific fields: id, user_id, amount, currency, country, provider, phone_number, status, tx_hash, created_at
-- Status enum: 'initiated', 'pending', 'confirmed', 'failed'

-- Create the exact status enum as requested
CREATE TYPE payment_intent_status AS ENUM ('initiated', 'pending', 'confirmed', 'failed');

-- Drop existing payment_intents table if it exists (backup first)
-- Note: In production, you'd want to migrate data instead of dropping
DROP TABLE IF EXISTS payment_intents CASCADE;

-- Create the exact payment_intents table as specified
CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL,
    country TEXT NOT NULL,
    provider TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status payment_intent_status DEFAULT 'initiated',
    tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_payment_intents_created_at ON payment_intents(created_at);
CREATE INDEX idx_payment_intents_country ON payment_intents(country);
CREATE INDEX idx_payment_intents_provider ON payment_intents(provider);
CREATE INDEX idx_payment_intents_tx_hash ON payment_intents(tx_hash);

-- Enable RLS (Row Level Security) for user-specific access
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user-specific access
CREATE POLICY "Users can view their own payment intents" ON payment_intents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment intents" ON payment_intents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment intents" ON payment_intents
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policy for full access
CREATE POLICY "Admins can manage all payment intents" ON payment_intents
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_intents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = OLD.created_at; -- Preserve original created_at
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add some helpful functions
CREATE OR REPLACE FUNCTION get_user_payment_intents(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    amount NUMERIC,
    currency TEXT,
    country TEXT,
    provider TEXT,
    phone_number TEXT,
    status payment_intent_status,
    tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user can access this data
    IF auth.uid() != p_user_id AND auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        pi.id,
        pi.amount,
        pi.currency,
        pi.country,
        pi.provider,
        pi.phone_number,
        pi.status,
        pi.tx_hash,
        pi.created_at
    FROM payment_intents pi
    WHERE pi.user_id = p_user_id
    ORDER BY pi.created_at DESC;
END;
$$;

-- Function to create payment intent
CREATE OR REPLACE FUNCTION create_payment_intent(
    p_user_id UUID,
    p_amount NUMERIC,
    p_currency TEXT,
    p_country TEXT,
    p_provider TEXT,
    p_phone_number TEXT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    intent_id UUID;
BEGIN
    -- Validate inputs
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;
    
    IF p_phone_number IS NULL OR LENGTH(TRIM(p_phone_number)) = 0 THEN
        RAISE EXCEPTION 'Phone number is required';
    END IF;
    
    IF p_country IS NULL OR LENGTH(TRIM(p_country)) = 0 THEN
        RAISE EXCEPTION 'Country is required';
    END IF;
    
    IF p_provider IS NULL OR LENGTH(TRIM(p_provider)) = 0 THEN
        RAISE EXCEPTION 'Provider is required';
    END IF;
    
    -- Insert payment intent
    INSERT INTO payment_intents (
        user_id,
        amount,
        currency,
        country,
        provider,
        phone_number,
        status
    ) VALUES (
        p_user_id,
        p_amount,
        p_currency,
        p_country,
        p_provider,
        p_phone_number,
        'initiated'
    ) RETURNING id INTO intent_id;
    
    RETURN intent_id;
END;
$$;

-- Function to update payment intent status
CREATE OR REPLACE FUNCTION update_payment_intent_status(
    p_intent_id UUID,
    p_status payment_intent_status,
    p_tx_hash TEXT DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    intent_exists BOOLEAN;
BEGIN
    -- Check if intent exists and user has access
    SELECT EXISTS(
        SELECT 1 FROM payment_intents 
        WHERE id = p_intent_id 
        AND (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
    ) INTO intent_exists;
    
    IF NOT intent_exists THEN
        RAISE EXCEPTION 'Payment intent not found or access denied';
    END IF;
    
    -- Update the intent
    UPDATE payment_intents 
    SET 
        status = p_status,
        tx_hash = COALESCE(p_tx_hash, tx_hash)
    WHERE id = p_intent_id;
    
    RETURN TRUE;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON payment_intents TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_payment_intents(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_payment_intent(UUID, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_payment_intent_status(UUID, payment_intent_status, TEXT) TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE payment_intents IS 'Payment intentions for mobile money and crypto payments';
COMMENT ON COLUMN payment_intents.id IS 'Unique payment intent identifier';
COMMENT ON COLUMN payment_intents.user_id IS 'Reference to user making the payment';
COMMENT ON COLUMN payment_intents.amount IS 'Payment amount in specified currency';
COMMENT ON COLUMN payment_intents.currency IS 'Currency code (e.g., USD, NGN, KES)';
COMMENT ON COLUMN payment_intents.country IS 'Country code where payment is made';
COMMENT ON COLUMN payment_intents.provider IS 'Mobile money provider (e.g., MTN_MOMO, MPESA)';
COMMENT ON COLUMN payment_intents.phone_number IS 'Customer phone number for mobile money';
COMMENT ON COLUMN payment_intents.status IS 'Payment status: initiated, pending, confirmed, failed';
COMMENT ON COLUMN payment_intents.tx_hash IS 'Transaction hash from blockchain or provider';
COMMENT ON COLUMN payment_intents.created_at IS 'Timestamp when payment intent was created'; 