-- Migration: Add webhook logs and wallet transaction tracking
-- Supports admin monitoring and audit trails

-- Create webhook logs table for admin monitoring
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id UUID REFERENCES payment_intents(id),
    webhook_type TEXT NOT NULL,
    status TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    wallet_credited BOOLEAN DEFAULT FALSE,
    wallet_id UUID REFERENCES user_wallets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet transactions table for audit trail
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES user_wallets(id),
    user_id UUID NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'FEE')),
    amount NUMERIC(20,8) NOT NULL,
    currency TEXT NOT NULL,
    description TEXT,
    reference TEXT, -- External transaction reference
    status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_webhook_logs_payment_intent ON webhook_logs(payment_intent_id);
CREATE INDEX idx_webhook_logs_type ON webhook_logs(webhook_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_processed_at ON webhook_logs(processed_at);

CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX idx_wallet_transactions_reference ON wallet_transactions(reference);

-- Enable RLS for security
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_logs (Admin only)
CREATE POLICY "Only admins can view webhook logs" ON webhook_logs
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

CREATE POLICY "System can insert webhook logs" ON webhook_logs
    FOR INSERT WITH CHECK (true); -- Allow system to insert

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view their own wallet transactions" ON wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage wallet transactions" ON wallet_transactions
    FOR ALL USING (true); -- System operations

CREATE POLICY "Admins can view all wallet transactions" ON wallet_transactions
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

-- Function to get user wallet balance with transaction history
CREATE OR REPLACE FUNCTION get_user_wallet_summary(p_user_id UUID, p_currency TEXT DEFAULT 'USDC')
RETURNS TABLE (
    wallet_id UUID,
    balance NUMERIC,
    currency TEXT,
    total_deposits NUMERIC,
    total_withdrawals NUMERIC,
    transaction_count BIGINT,
    last_transaction_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check permissions
    IF auth.uid() != p_user_id AND auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        w.id as wallet_id,
        w.balance,
        w.currency,
        COALESCE(SUM(CASE WHEN t.type IN ('DEPOSIT', 'TRANSFER_IN') THEN t.amount ELSE 0 END), 0) as total_deposits,
        COALESCE(SUM(CASE WHEN t.type IN ('WITHDRAWAL', 'TRANSFER_OUT', 'FEE') THEN t.amount ELSE 0 END), 0) as total_withdrawals,
        COUNT(t.id) as transaction_count,
        MAX(t.created_at) as last_transaction_at
    FROM user_wallets w
    LEFT JOIN wallet_transactions t ON w.id = t.wallet_id
    WHERE w.user_id = p_user_id 
    AND w.currency = p_currency
    AND w.is_active = true
    GROUP BY w.id, w.balance, w.currency;
END;
$$;

-- Function to credit wallet (used by webhook)
CREATE OR REPLACE FUNCTION credit_user_wallet(
    p_user_id UUID,
    p_amount NUMERIC,
    p_currency TEXT,
    p_description TEXT,
    p_reference TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_wallet_id UUID;
    v_transaction_id UUID;
    v_new_balance NUMERIC;
BEGIN
    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;
    
    -- Get or create wallet
    SELECT id INTO v_wallet_id
    FROM user_wallets 
    WHERE user_id = p_user_id 
    AND currency = p_currency 
    AND is_active = true;
    
    IF v_wallet_id IS NULL THEN
        INSERT INTO user_wallets (user_id, currency, balance, is_active)
        VALUES (p_user_id, p_currency, 0, true)
        RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Update wallet balance
    UPDATE user_wallets 
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id
    RETURNING balance INTO v_new_balance;
    
    -- Create transaction record
    INSERT INTO wallet_transactions (
        wallet_id, user_id, type, amount, currency, 
        description, reference, status
    ) VALUES (
        v_wallet_id, p_user_id, 'DEPOSIT', p_amount, p_currency,
        p_description, p_reference, 'COMPLETED'
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$;

-- Function to get payment statistics for admin
CREATE OR REPLACE FUNCTION get_payment_statistics(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_payments BIGINT,
    successful_payments BIGINT,
    failed_payments BIGINT,
    pending_payments BIGINT,
    total_amount NUMERIC,
    successful_amount NUMERIC,
    average_amount NUMERIC,
    top_country TEXT,
    top_provider TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check admin permissions
    IF auth.jwt() ->> 'role' != 'admin' AND auth.jwt() ->> 'user_role' != 'admin' THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        COUNT(CASE WHEN status IN ('initiated', 'pending') THEN 1 END) as pending_payments,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) as successful_amount,
        COALESCE(AVG(amount), 0) as average_amount,
        (SELECT country FROM payment_intents 
         WHERE created_at BETWEEN p_start_date AND p_end_date 
         GROUP BY country ORDER BY COUNT(*) DESC LIMIT 1) as top_country,
        (SELECT provider FROM payment_intents 
         WHERE created_at BETWEEN p_start_date AND p_end_date 
         GROUP BY provider ORDER BY COUNT(*) DESC LIMIT 1) as top_provider
    FROM payment_intents
    WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT ON webhook_logs TO anon, authenticated;
GRANT SELECT, INSERT ON wallet_transactions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_wallet_summary(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION credit_user_wallet(UUID, NUMERIC, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_payment_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO anon, authenticated;

-- Add comments
COMMENT ON TABLE webhook_logs IS 'Logs of webhook events for admin monitoring';
COMMENT ON TABLE wallet_transactions IS 'Audit trail of all wallet transactions';
COMMENT ON FUNCTION credit_user_wallet IS 'Safely credit user wallet with transaction logging';
COMMENT ON FUNCTION get_payment_statistics IS 'Get payment statistics for admin dashboard'; 