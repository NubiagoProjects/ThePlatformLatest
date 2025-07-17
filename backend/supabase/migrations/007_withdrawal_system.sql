-- Migration: Withdrawal System - withdrawal_requests table and related functionality
-- Supports stablecoin withdrawals with admin approval and automatic processing

-- Create withdrawal_requests table with exact schema
CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    to_wallet TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Additional fields for better functionality
    currency TEXT NOT NULL DEFAULT 'USDC',
    withdrawal_method TEXT DEFAULT 'crypto' CHECK (withdrawal_method IN ('crypto', 'mobile_money', 'bank')),
    destination_details JSONB DEFAULT '{}',
    admin_notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    transaction_hash TEXT,
    fee_amount NUMERIC(20,8) DEFAULT 0,
    net_amount NUMERIC(20,8) GENERATED ALWAYS AS (amount - fee_amount) STORED,
    yellowcard_reference TEXT,
    auto_approved BOOLEAN DEFAULT FALSE
);

-- Enhanced user_profiles table for GeoIP personalization
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    country_code TEXT,
    detected_country TEXT,
    preferred_currency TEXT DEFAULT 'USD',
    preferred_provider TEXT,
    phone_country_code TEXT,
    timezone TEXT,
    language TEXT DEFAULT 'en',
    geoip_data JSONB DEFAULT '{}',
    kyc_level TEXT DEFAULT 'basic' CHECK (kyc_level IN ('basic', 'verified', 'enhanced')),
    withdrawal_limits JSONB DEFAULT '{"daily": 1000, "monthly": 10000}',
    auto_approve_withdrawals BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);
CREATE INDEX idx_withdrawal_requests_amount ON withdrawal_requests(amount);
CREATE INDEX idx_withdrawal_requests_method ON withdrawal_requests(withdrawal_method);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_country ON user_profiles(country_code);
CREATE INDEX idx_user_profiles_provider ON user_profiles(preferred_provider);

-- Enable RLS for security
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests" ON withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" ON withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending requests" ON withdrawal_requests
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        status IN ('requested', 'processing')
    );

CREATE POLICY "Admins can manage all withdrawal requests" ON withdrawal_requests
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

-- Function to check user's withdrawal limits
CREATE OR REPLACE FUNCTION check_withdrawal_limits(
    p_user_id UUID,
    p_amount NUMERIC
)
RETURNS TABLE (
    can_withdraw BOOLEAN,
    reason TEXT,
    daily_used NUMERIC,
    daily_limit NUMERIC,
    monthly_used NUMERIC,
    monthly_limit NUMERIC
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_profile RECORD;
    v_daily_used NUMERIC := 0;
    v_monthly_used NUMERIC := 0;
    v_daily_limit NUMERIC := 1000;
    v_monthly_limit NUMERIC := 10000;
BEGIN
    -- Get user profile with limits
    SELECT * INTO v_profile
    FROM user_profiles 
    WHERE user_id = p_user_id;
    
    IF FOUND THEN
        v_daily_limit := COALESCE((v_profile.withdrawal_limits->>'daily')::NUMERIC, 1000);
        v_monthly_limit := COALESCE((v_profile.withdrawal_limits->>'monthly')::NUMERIC, 10000);
    END IF;
    
    -- Calculate daily usage (last 24 hours)
    SELECT COALESCE(SUM(amount), 0) INTO v_daily_used
    FROM withdrawal_requests
    WHERE user_id = p_user_id
    AND status IN ('approved', 'completed', 'processing')
    AND created_at >= NOW() - INTERVAL '24 hours';
    
    -- Calculate monthly usage (last 30 days)
    SELECT COALESCE(SUM(amount), 0) INTO v_monthly_used
    FROM withdrawal_requests
    WHERE user_id = p_user_id
    AND status IN ('approved', 'completed', 'processing')
    AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Check limits
    IF v_daily_used + p_amount > v_daily_limit THEN
        RETURN QUERY SELECT FALSE, 'Daily withdrawal limit exceeded', v_daily_used, v_daily_limit, v_monthly_used, v_monthly_limit;
        RETURN;
    END IF;
    
    IF v_monthly_used + p_amount > v_monthly_limit THEN
        RETURN QUERY SELECT FALSE, 'Monthly withdrawal limit exceeded', v_daily_used, v_daily_limit, v_monthly_used, v_monthly_limit;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT TRUE, 'Within limits', v_daily_used, v_daily_limit, v_monthly_used, v_monthly_limit;
END;
$$;

-- Function to process withdrawal request
CREATE OR REPLACE FUNCTION process_withdrawal_request(
    p_user_id UUID,
    p_amount NUMERIC,
    p_to_wallet TEXT,
    p_currency TEXT DEFAULT 'USDC',
    p_withdrawal_method TEXT DEFAULT 'crypto',
    p_destination_details JSONB DEFAULT '{}'
)
RETURNS TABLE (
    success BOOLEAN,
    withdrawal_id UUID,
    message TEXT,
    auto_approved BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_wallet_balance NUMERIC;
    v_withdrawal_id UUID;
    v_limits_check RECORD;
    v_profile RECORD;
    v_fee_amount NUMERIC := 0;
    v_auto_approve BOOLEAN := FALSE;
BEGIN
    -- Check withdrawal limits
    SELECT * INTO v_limits_check
    FROM check_withdrawal_limits(p_user_id, p_amount);
    
    IF NOT v_limits_check.can_withdraw THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, v_limits_check.reason, FALSE;
        RETURN;
    END IF;
    
    -- Check wallet balance
    SELECT balance INTO v_wallet_balance
    FROM user_wallets
    WHERE user_id = p_user_id 
    AND currency = p_currency 
    AND is_active = true;
    
    IF v_wallet_balance IS NULL OR v_wallet_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Insufficient wallet balance', FALSE;
        RETURN;
    END IF;
    
    -- Get user profile for auto-approval check
    SELECT * INTO v_profile
    FROM user_profiles
    WHERE user_id = p_user_id;
    
    -- Calculate fees (2% for crypto, 3% for mobile money)
    IF p_withdrawal_method = 'crypto' THEN
        v_fee_amount := p_amount * 0.02;
    ELSIF p_withdrawal_method = 'mobile_money' THEN
        v_fee_amount := p_amount * 0.03;
    ELSE
        v_fee_amount := p_amount * 0.025;
    END IF;
    
    -- Check if auto-approval is enabled
    IF v_profile.auto_approve_withdrawals AND p_amount <= 500 THEN
        v_auto_approve := TRUE;
    END IF;
    
    -- Create withdrawal request
    INSERT INTO withdrawal_requests (
        user_id, amount, to_wallet, currency, withdrawal_method,
        destination_details, fee_amount, auto_approved,
        status
    ) VALUES (
        p_user_id, p_amount, p_to_wallet, p_currency, p_withdrawal_method,
        p_destination_details, v_fee_amount, v_auto_approve,
        CASE WHEN v_auto_approve THEN 'approved' ELSE 'requested' END
    ) RETURNING id INTO v_withdrawal_id;
    
    -- Reserve funds in wallet (reduce balance)
    UPDATE user_wallets 
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND currency = p_currency;
    
    -- Log transaction
    INSERT INTO wallet_transactions (
        wallet_id, user_id, type, amount, currency,
        description, reference, status, metadata
    ) VALUES (
        (SELECT id FROM user_wallets WHERE user_id = p_user_id AND currency = p_currency),
        p_user_id, 'WITHDRAWAL', -p_amount, p_currency,
        'Withdrawal request - ' || v_withdrawal_id,
        v_withdrawal_id::TEXT, 
        CASE WHEN v_auto_approve THEN 'COMPLETED' ELSE 'PENDING' END,
        jsonb_build_object(
            'withdrawal_id', v_withdrawal_id,
            'to_wallet', p_to_wallet,
            'method', p_withdrawal_method,
            'auto_approved', v_auto_approve
        )
    );
    
    RETURN QUERY SELECT TRUE, v_withdrawal_id, 
        CASE WHEN v_auto_approve THEN 'Withdrawal auto-approved and processing' 
             ELSE 'Withdrawal request submitted for admin approval' END,
        v_auto_approve;
END;
$$;

-- Function to update user profile with GeoIP data
CREATE OR REPLACE FUNCTION update_user_geoip_profile(
    p_user_id UUID,
    p_country_code TEXT,
    p_detected_country TEXT,
    p_geoip_data JSONB DEFAULT '{}',
    p_preferred_provider TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    -- Insert or update user profile
    INSERT INTO user_profiles (
        user_id, country_code, detected_country, geoip_data, preferred_provider
    ) VALUES (
        p_user_id, p_country_code, p_detected_country, p_geoip_data, p_preferred_provider
    ) ON CONFLICT (user_id) DO UPDATE SET
        country_code = EXCLUDED.country_code,
        detected_country = EXCLUDED.detected_country,
        geoip_data = user_profiles.geoip_data || EXCLUDED.geoip_data,
        preferred_provider = COALESCE(EXCLUDED.preferred_provider, user_profiles.preferred_provider),
        updated_at = NOW()
    RETURNING id INTO v_profile_id;
    
    RETURN v_profile_id;
END;
$$;

-- Function to get withdrawal statistics for admin
CREATE OR REPLACE FUNCTION get_withdrawal_statistics(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_requests BIGINT,
    pending_requests BIGINT,
    approved_requests BIGINT,
    rejected_requests BIGINT,
    total_amount NUMERIC,
    approved_amount NUMERIC,
    average_amount NUMERIC,
    auto_approved_count BIGINT,
    manual_approved_count BIGINT
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
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'requested' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status IN ('approved', 'completed') THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status IN ('approved', 'completed') THEN amount ELSE 0 END), 0) as approved_amount,
        COALESCE(AVG(amount), 0) as average_amount,
        COUNT(CASE WHEN auto_approved = TRUE THEN 1 END) as auto_approved_count,
        COUNT(CASE WHEN status IN ('approved', 'completed') AND auto_approved = FALSE THEN 1 END) as manual_approved_count
    FROM withdrawal_requests
    WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Function to approve/reject withdrawal
CREATE OR REPLACE FUNCTION admin_process_withdrawal(
    p_withdrawal_id UUID,
    p_action TEXT, -- 'approve' or 'reject'
    p_admin_notes TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_withdrawal RECORD;
    v_new_status TEXT;
BEGIN
    -- Check admin permissions
    IF auth.jwt() ->> 'role' != 'admin' AND auth.jwt() ->> 'user_role' != 'admin' THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;
    
    -- Get withdrawal request
    SELECT * INTO v_withdrawal
    FROM withdrawal_requests
    WHERE id = p_withdrawal_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal request not found';
    END IF;
    
    IF v_withdrawal.status != 'requested' THEN
        RAISE EXCEPTION 'Withdrawal request already processed';
    END IF;
    
    -- Determine new status
    IF p_action = 'approve' THEN
        v_new_status := 'approved';
    ELSIF p_action = 'reject' THEN
        v_new_status := 'rejected';
        
        -- Refund to wallet if rejected
        UPDATE user_wallets 
        SET balance = balance + v_withdrawal.amount,
            updated_at = NOW()
        WHERE user_id = v_withdrawal.user_id 
        AND currency = v_withdrawal.currency;
        
        -- Update transaction status
        UPDATE wallet_transactions
        SET status = 'CANCELLED',
            metadata = metadata || jsonb_build_object('rejection_reason', p_admin_notes)
        WHERE reference = v_withdrawal.id::TEXT;
        
    ELSE
        RAISE EXCEPTION 'Invalid action. Use "approve" or "reject"';
    END IF;
    
    -- Update withdrawal request
    UPDATE withdrawal_requests 
    SET status = v_new_status,
        admin_notes = p_admin_notes,
        processed_at = NOW(),
        processed_by = p_admin_id,
        updated_at = NOW()
    WHERE id = p_withdrawal_id;
    
    RETURN TRUE;
END;
$$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON withdrawal_requests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_withdrawal_limits(UUID, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_withdrawal_request(UUID, NUMERIC, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_geoip_profile(UUID, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_withdrawal_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_process_withdrawal(UUID, TEXT, TEXT, UUID) TO anon, authenticated;

-- Add comments
COMMENT ON TABLE withdrawal_requests IS 'User withdrawal requests for stablecoins and mobile money';
COMMENT ON TABLE user_profiles IS 'User profiles with GeoIP data and preferences for personalization';
COMMENT ON FUNCTION process_withdrawal_request IS 'Process new withdrawal request with balance and limit checks';
COMMENT ON FUNCTION check_withdrawal_limits IS 'Check if withdrawal amount is within user limits';
COMMENT ON FUNCTION update_user_geoip_profile IS 'Update user profile with GeoIP detection data';
COMMENT ON FUNCTION admin_process_withdrawal IS 'Admin function to approve or reject withdrawal requests'; 