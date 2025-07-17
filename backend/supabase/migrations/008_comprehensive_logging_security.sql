-- Migration: Comprehensive System Logging and Enhanced Security
-- Full system event logging, security hardening, and audit trails

-- ================================
-- SYSTEM LOGGING TABLES
-- ================================

-- Comprehensive API event logs
CREATE TABLE api_event_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    request_id UUID DEFAULT uuid_generate_v4(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    request_headers JSONB DEFAULT '{}',
    request_body JSONB DEFAULT '{}',
    response_status INTEGER,
    response_body JSONB DEFAULT '{}',
    response_time_ms INTEGER,
    error_message TEXT,
    stack_trace TEXT,
    session_id TEXT,
    api_key_id TEXT,
    rate_limit_hit BOOLEAN DEFAULT FALSE,
    success BOOLEAN GENERATED ALWAYS AS (response_status >= 200 AND response_status < 400) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced webhook logs with security tracking
CREATE TABLE enhanced_webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    webhook_type TEXT NOT NULL,
    source TEXT NOT NULL, -- 'yellowcard', 'internal', etc.
    payment_intent_id UUID REFERENCES payment_intents(id),
    payload JSONB NOT NULL,
    headers JSONB DEFAULT '{}',
    signature TEXT,
    signature_valid BOOLEAN,
    ip_address INET,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'rejected')),
    processing_time_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    wallet_credited BOOLEAN DEFAULT FALSE,
    wallet_id UUID REFERENCES user_wallets(id),
    duplicate_detected BOOLEAN DEFAULT FALSE,
    fraud_score INTEGER DEFAULT 0 CHECK (fraud_score >= 0 AND fraud_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Security event logs for fraud detection
CREATE TABLE security_event_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_attempt', 'failed_login', 'password_reset', 'account_lockout',
        'suspicious_payment', 'duplicate_payment', 'unusual_location',
        'high_value_transaction', 'rapid_transactions', 'webhook_replay',
        'invalid_signature', 'rate_limit_exceeded', 'unauthorized_access'
    )),
    severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    details JSONB DEFAULT '{}',
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    action_taken TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Failed attempt tracking for security
CREATE TABLE failed_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attempt_type TEXT NOT NULL CHECK (attempt_type IN (
        'payment', 'login', 'webhook', 'api_call', 'withdrawal'
    )),
    identifier TEXT NOT NULL, -- phone, email, ip, user_id, etc.
    failure_reason TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    payload JSONB DEFAULT '{}',
    retry_after TIMESTAMP WITH TIME ZONE,
    blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin action audit logs
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- 'payment', 'user', 'withdrawal', etc.
    resource_id UUID,
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS and notification logs
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'sms', 'email', 'push', 'webhook', 'in_app'
    )),
    recipient_id UUID REFERENCES users(id),
    recipient_contact TEXT NOT NULL, -- phone, email, etc.
    template_id TEXT,
    subject TEXT,
    content TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    provider TEXT, -- 'twilio', 'sendgrid', etc.
    external_id TEXT,
    cost_usd NUMERIC(10,4),
    delivery_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- ================================
-- SECURITY ENHANCEMENTS
-- ================================

-- API rate limiting tracking
CREATE TABLE rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL, -- ip_address, user_id, api_key
    endpoint TEXT NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    request_count INTEGER DEFAULT 1,
    limit_exceeded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

-- Fraud detection patterns
CREATE TABLE fraud_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_name TEXT NOT NULL UNIQUE,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'duplicate_payment', 'rapid_transactions', 'unusual_location',
        'suspicious_amounts', 'compromised_device', 'velocity_check'
    )),
    rules JSONB NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    action TEXT NOT NULL CHECK (action IN ('flag', 'review', 'block', 'decline')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session management for security
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    location_country TEXT,
    location_city TEXT,
    is_mobile BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    invalidated BOOLEAN DEFAULT FALSE,
    invalidated_at TIMESTAMP WITH TIME ZONE,
    invalidation_reason TEXT
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- API event logs indexes
CREATE INDEX idx_api_event_logs_timestamp ON api_event_logs(timestamp);
CREATE INDEX idx_api_event_logs_user_id ON api_event_logs(user_id);
CREATE INDEX idx_api_event_logs_endpoint ON api_event_logs(endpoint);
CREATE INDEX idx_api_event_logs_success ON api_event_logs(success);
CREATE INDEX idx_api_event_logs_request_id ON api_event_logs(request_id);

-- Enhanced webhook logs indexes
CREATE INDEX idx_enhanced_webhook_logs_timestamp ON enhanced_webhook_logs(timestamp);
CREATE INDEX idx_enhanced_webhook_logs_payment_intent ON enhanced_webhook_logs(payment_intent_id);
CREATE INDEX idx_enhanced_webhook_logs_type ON enhanced_webhook_logs(webhook_type);
CREATE INDEX idx_enhanced_webhook_logs_signature_valid ON enhanced_webhook_logs(signature_valid);
CREATE INDEX idx_enhanced_webhook_logs_duplicate ON enhanced_webhook_logs(duplicate_detected);

-- Security event logs indexes
CREATE INDEX idx_security_event_logs_timestamp ON security_event_logs(timestamp);
CREATE INDEX idx_security_event_logs_user_id ON security_event_logs(user_id);
CREATE INDEX idx_security_event_logs_type ON security_event_logs(event_type);
CREATE INDEX idx_security_event_logs_severity ON security_event_logs(severity);
CREATE INDEX idx_security_event_logs_risk_score ON security_event_logs(risk_score);

-- Failed attempts indexes
CREATE INDEX idx_failed_attempts_timestamp ON failed_attempts(timestamp);
CREATE INDEX idx_failed_attempts_identifier ON failed_attempts(identifier);
CREATE INDEX idx_failed_attempts_type ON failed_attempts(attempt_type);
CREATE INDEX idx_failed_attempts_blocked ON failed_attempts(blocked);

-- Rate limiting indexes
CREATE INDEX idx_rate_limit_tracking_identifier ON rate_limit_tracking(identifier);
CREATE INDEX idx_rate_limit_tracking_endpoint ON rate_limit_tracking(endpoint);
CREATE INDEX idx_rate_limit_tracking_window ON rate_limit_tracking(window_start);

-- Session management indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on all new tables
ALTER TABLE api_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for API event logs (Admin only)
CREATE POLICY "Admins can view all API logs" ON api_event_logs
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

CREATE POLICY "System can insert API logs" ON api_event_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for webhook logs (Admin only)
CREATE POLICY "Admins can view all webhook logs" ON enhanced_webhook_logs
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

CREATE POLICY "System can manage webhook logs" ON enhanced_webhook_logs
    FOR ALL WITH CHECK (true);

-- RLS Policies for security logs (Admin only)
CREATE POLICY "Admins can view security logs" ON security_event_logs
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

CREATE POLICY "System can insert security logs" ON security_event_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for failed attempts (Admin only)
CREATE POLICY "Admins can view failed attempts" ON failed_attempts
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

CREATE POLICY "System can insert failed attempts" ON failed_attempts
    FOR INSERT WITH CHECK (true);

-- RLS Policies for admin audit logs (Admin only)
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

CREATE POLICY "System can insert audit logs" ON admin_audit_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for notification logs
CREATE POLICY "Users can view their own notifications" ON notification_logs
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Admins can view all notifications" ON notification_logs
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

CREATE POLICY "System can manage notifications" ON notification_logs
    FOR ALL WITH CHECK (true);

-- RLS Policies for user sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

CREATE POLICY "System can manage sessions" ON user_sessions
    FOR ALL WITH CHECK (true);

-- ================================
-- SECURITY FUNCTIONS
-- ================================

-- Function to log API events
CREATE OR REPLACE FUNCTION log_api_event(
    p_endpoint TEXT,
    p_method TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_headers JSONB DEFAULT '{}',
    p_request_body JSONB DEFAULT '{}',
    p_response_status INTEGER DEFAULT NULL,
    p_response_body JSONB DEFAULT '{}',
    p_response_time_ms INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO api_event_logs (
        endpoint, method, user_id, ip_address, user_agent,
        request_headers, request_body, response_status, response_body,
        response_time_ms, error_message, session_id
    ) VALUES (
        p_endpoint, p_method, p_user_id, p_ip_address, p_user_agent,
        p_request_headers, p_request_body, p_response_status, p_response_body,
        p_response_time_ms, p_error_message, p_session_id
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Function to detect duplicate payments
CREATE OR REPLACE FUNCTION detect_duplicate_payment(
    p_user_id UUID,
    p_amount NUMERIC,
    p_currency TEXT,
    p_provider TEXT,
    p_phone_number TEXT,
    p_time_window_minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_duplicate_count INTEGER;
BEGIN
    -- Check for duplicate payments in the specified time window
    SELECT COUNT(*) INTO v_duplicate_count
    FROM payment_intents
    WHERE user_id = p_user_id
    AND amount = p_amount
    AND currency = p_currency
    AND provider = p_provider
    AND phone_number = p_phone_number
    AND created_at >= NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
    AND status != 'failed';
    
    -- Log security event if duplicate detected
    IF v_duplicate_count > 0 THEN
        INSERT INTO security_event_logs (
            event_type, severity, user_id, details, risk_score
        ) VALUES (
            'duplicate_payment', 'medium', p_user_id,
            jsonb_build_object(
                'duplicate_count', v_duplicate_count,
                'amount', p_amount,
                'currency', p_currency,
                'provider', p_provider,
                'time_window_minutes', p_time_window_minutes
            ),
            75
        );
    END IF;
    
    RETURN v_duplicate_count > 0;
END;
$$;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_limit INTEGER,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_window_start TIMESTAMP WITH TIME ZONE;
    v_current_count INTEGER;
BEGIN
    -- Calculate window start time
    v_window_start := date_trunc('minute', NOW()) - ((extract(minute from NOW())::INTEGER % p_window_minutes) || ' minutes')::INTERVAL;
    
    -- Get or create rate limit record
    INSERT INTO rate_limit_tracking (identifier, endpoint, window_start, request_count)
    VALUES (p_identifier, p_endpoint, v_window_start, 1)
    ON CONFLICT (identifier, endpoint, window_start)
    DO UPDATE SET 
        request_count = rate_limit_tracking.request_count + 1,
        updated_at = NOW()
    RETURNING request_count INTO v_current_count;
    
    -- Check if limit exceeded
    IF v_current_count > p_limit THEN
        UPDATE rate_limit_tracking 
        SET limit_exceeded = TRUE
        WHERE identifier = p_identifier 
        AND endpoint = p_endpoint 
        AND window_start = v_window_start;
        
        -- Log security event
        INSERT INTO security_event_logs (
            event_type, severity, details, risk_score
        ) VALUES (
            'rate_limit_exceeded', 'medium',
            jsonb_build_object(
                'identifier', p_identifier,
                'endpoint', p_endpoint,
                'current_count', v_current_count,
                'limit', p_limit
            ),
            60
        );
        
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Function to calculate fraud score
CREATE OR REPLACE FUNCTION calculate_fraud_score(
    p_user_id UUID,
    p_amount NUMERIC,
    p_ip_address INET,
    p_payment_details JSONB
)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_fraud_score INTEGER := 0;
    v_recent_payments INTEGER;
    v_unusual_location BOOLEAN := FALSE;
    v_high_amount BOOLEAN := FALSE;
BEGIN
    -- Check for rapid transactions (within 1 hour)
    SELECT COUNT(*) INTO v_recent_payments
    FROM payment_intents
    WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '1 hour';
    
    IF v_recent_payments > 5 THEN
        v_fraud_score := v_fraud_score + 30;
    ELSIF v_recent_payments > 3 THEN
        v_fraud_score := v_fraud_score + 15;
    END IF;
    
    -- Check for high amount (above typical user pattern)
    IF p_amount > 1000 THEN
        v_fraud_score := v_fraud_score + 20;
        v_high_amount := TRUE;
    ELSIF p_amount > 500 THEN
        v_fraud_score := v_fraud_score + 10;
    END IF;
    
    -- Check for unusual location (simplified - in production, use proper geolocation)
    -- This would compare against user's typical locations
    IF v_unusual_location THEN
        v_fraud_score := v_fraud_score + 25;
    END IF;
    
    -- Log fraud calculation
    INSERT INTO security_event_logs (
        event_type, severity, user_id, details, risk_score
    ) VALUES (
        'suspicious_payment', 
        CASE WHEN v_fraud_score >= 70 THEN 'high'
             WHEN v_fraud_score >= 40 THEN 'medium'
             ELSE 'low' END,
        p_user_id,
        jsonb_build_object(
            'calculated_score', v_fraud_score,
            'recent_payments', v_recent_payments,
            'high_amount', v_high_amount,
            'unusual_location', v_unusual_location,
            'amount', p_amount
        ),
        v_fraud_score
    );
    
    RETURN LEAST(v_fraud_score, 100);
END;
$$;

-- ================================
-- AUTOMATIC CLEANUP FUNCTIONS
-- ================================

-- Function to clean old logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_retention_days INTEGER := 90;
BEGIN
    -- Clean API event logs older than retention period
    DELETE FROM api_event_logs 
    WHERE created_at < NOW() - (v_retention_days || ' days')::INTERVAL;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Clean webhook logs
    DELETE FROM enhanced_webhook_logs 
    WHERE created_at < NOW() - (v_retention_days || ' days')::INTERVAL;
    GET DIAGNOSTICS v_deleted_count = v_deleted_count + ROW_COUNT;
    
    -- Clean security logs (keep longer)
    DELETE FROM security_event_logs 
    WHERE created_at < NOW() - ((v_retention_days * 2) || ' days')::INTERVAL;
    GET DIAGNOSTICS v_deleted_count = v_deleted_count + ROW_COUNT;
    
    -- Clean failed attempts
    DELETE FROM failed_attempts 
    WHERE created_at < NOW() - (30 || ' days')::INTERVAL;
    GET DIAGNOSTICS v_deleted_count = v_deleted_count + ROW_COUNT;
    
    -- Clean expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR invalidated = TRUE;
    GET DIAGNOSTICS v_deleted_count = v_deleted_count + ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- ================================
-- TRIGGERS FOR AUTOMATIC LOGGING
-- ================================

-- Trigger to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rate_limit_tracking_updated_at BEFORE UPDATE ON rate_limit_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fraud_patterns_updated_at BEFORE UPDATE ON fraud_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- GRANT PERMISSIONS
-- ================================

-- Grant appropriate permissions
GRANT SELECT, INSERT ON api_event_logs TO anon, authenticated;
GRANT SELECT, INSERT ON enhanced_webhook_logs TO anon, authenticated;
GRANT SELECT, INSERT ON security_event_logs TO anon, authenticated;
GRANT SELECT, INSERT ON failed_attempts TO anon, authenticated;
GRANT SELECT, INSERT ON admin_audit_logs TO anon, authenticated;
GRANT SELECT, INSERT ON notification_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON rate_limit_tracking TO anon, authenticated;
GRANT SELECT ON fraud_patterns TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO anon, authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION log_api_event TO anon, authenticated;
GRANT EXECUTE ON FUNCTION detect_duplicate_payment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_fraud_score TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_logs TO anon, authenticated;

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================

COMMENT ON TABLE api_event_logs IS 'Comprehensive logging of all API events and requests';
COMMENT ON TABLE enhanced_webhook_logs IS 'Enhanced webhook logging with security and fraud detection';
COMMENT ON TABLE security_event_logs IS 'Security events and potential threats logging';
COMMENT ON TABLE failed_attempts IS 'Failed login and payment attempts for security monitoring';
COMMENT ON TABLE admin_audit_logs IS 'Audit trail of all administrative actions';
COMMENT ON TABLE notification_logs IS 'SMS, email and push notification delivery logs';
COMMENT ON TABLE rate_limit_tracking IS 'API rate limiting and throttling tracking';
COMMENT ON TABLE fraud_patterns IS 'Configurable fraud detection patterns and rules';
COMMENT ON TABLE user_sessions IS 'User session management and security tracking';

COMMENT ON FUNCTION log_api_event IS 'Log API events with comprehensive details';
COMMENT ON FUNCTION detect_duplicate_payment IS 'Detect duplicate payment attempts within time window';
COMMENT ON FUNCTION check_rate_limit IS 'Check and enforce API rate limits';
COMMENT ON FUNCTION calculate_fraud_score IS 'Calculate fraud risk score for transactions';
COMMENT ON FUNCTION cleanup_old_logs IS 'Clean up old logs according to retention policy'; 