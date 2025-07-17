-- Migration: Add dedicated mobile_money_providers table
-- This provides the exact table structure requested while maintaining existing functionality

-- Create the mobile_money_providers table
CREATE TABLE mobile_money_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country TEXT NOT NULL, -- ISO 3166-1 alpha-2 country code
    provider TEXT NOT NULL, -- Provider name/code
    logo_url TEXT NOT NULL, -- URL to provider logo
    ussd_code TEXT NOT NULL, -- USSD code for the provider
    instructions TEXT NOT NULL, -- JSON string with step-by-step instructions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(country, provider)
);

-- Create indexes for efficient querying
CREATE INDEX idx_mobile_money_providers_country ON mobile_money_providers(country);
CREATE INDEX idx_mobile_money_providers_provider ON mobile_money_providers(provider);

-- Enable RLS (Row Level Security)
ALTER TABLE mobile_money_providers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (providers are public information)
CREATE POLICY "Allow public read access to mobile money providers" ON mobile_money_providers
    FOR SELECT USING (true);

-- Create policy for admin write access
CREATE POLICY "Allow admin write access to mobile money providers" ON mobile_money_providers
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'user_role' = 'admin'
    );

-- Insert initial data for major African mobile money providers
INSERT INTO mobile_money_providers (country, provider, logo_url, ussd_code, instructions) VALUES
-- Nigeria
('NG', 'MTN_MOMO', '/images/providers/mtn-momo.png', '*904#', '{"steps": ["Dial *904# on your MTN phone", "Select Transfer/Send Money", "Enter merchant code provided", "Enter amount", "Enter your PIN to confirm"], "tips": ["Ensure you have sufficient balance", "Keep your PIN secure", "Transaction is processed within 5 minutes"]}'),

-- Kenya  
('KE', 'MPESA', '/images/providers/mpesa.png', '*334#', '{"steps": ["Dial *334# on your Safaricom phone", "Select Pay Bill", "Enter business number provided", "Enter account number", "Enter amount", "Enter your PIN"], "tips": ["M-Pesa is available 24/7", "Check your balance before transaction", "Keep transaction SMS for reference"]}'),

-- Uganda
('UG', 'MTN_MOMO', '/images/providers/mtn-momo.png', '*165#', '{"steps": ["Dial *165# on your MTN phone", "Select Send Money", "Enter payment code", "Enter amount", "Confirm with PIN"], "tips": ["Service available 24/7", "Minimum transaction is UGX 500", "Maximum daily limit applies"]}'),

-- Ghana
('GH', 'MTN_MOMO', '/images/providers/mtn-momo.png', '*170#', '{"steps": ["Dial *170# on your MTN phone", "Select Transfer Money", "Select Other Networks/Wallets", "Enter merchant wallet number", "Enter amount", "Confirm with PIN"], "tips": ["Ensure merchant number is correct", "Transaction fees apply", "Service available 24/7"]}'),

('GH', 'VODAFONE_CASH', '/images/providers/vodafone-cash.png', '*110#', '{"steps": ["Dial *110# on your Vodafone phone", "Select Transfer Money", "Enter merchant number", "Enter amount", "Enter your PIN"], "tips": ["Keep your PIN confidential", "Check balance before transfer", "Transaction processed instantly"]}'),

-- Tanzania
('TZ', 'TIGO_CASH', '/images/providers/tigo-cash.png', '*150#', '{"steps": ["Dial *150# on your Tigo phone", "Select Send Money", "Enter recipient number", "Enter amount", "Confirm with PIN"], "tips": ["Service available 24/7", "Transaction limit applies", "Keep SMS receipt"]}'),

('TZ', 'AIRTEL_MONEY', '/images/providers/airtel-money.png', '*150*00#', '{"steps": ["Dial *150*00# on your Airtel phone", "Select Money Transfer", "Enter recipient details", "Enter amount", "Confirm transaction"], "tips": ["Airtel Money works across borders", "Low transaction fees", "Instant processing"]}'),

-- South Africa
('ZA', 'MTN_MOMO', '/images/providers/mtn-momo.png', '*141#', '{"steps": ["Dial *141# on your MTN phone", "Select Send Money", "Enter merchant details", "Enter amount", "Enter PIN to complete"], "tips": ["Available in multiple languages", "Secure PIN required", "Transaction confirmed via SMS"]}'),

-- Senegal
('SN', 'ORANGE_MONEY', '/images/providers/orange-money.png', '#144#', '{"steps": ["Dial #144# on your Orange phone", "Select Transfert", "Enter merchant number", "Enter amount", "Confirm with secret code"], "tips": ["Service in French and local languages", "Wide agent network", "Secure transactions"]}'),

('SN', 'WAVE', '/images/providers/wave.png', '*999#', '{"steps": ["Open Wave app or dial *999#", "Select Send Money", "Enter merchant phone number", "Enter amount", "Confirm transaction"], "tips": ["No fees for basic transfers", "Fast and secure", "Digital wallet features"]}'),

-- Burkina Faso
('BF', 'MOOV_MONEY', '/images/providers/moov-money.png', '#145#', '{"steps": ["Dial #145# on your Moov phone", "Select Transfert dargent", "Enter destination number", "Enter amount", "Confirm with PIN"], "tips": ["Available in French", "Reliable network coverage", "Competitive rates"]}'),

-- Togo
('TG', 'FLOOZ', '/images/providers/flooz.png', '*144#', '{"steps": ["Dial *144# on your phone", "Select Transfer", "Enter merchant number", "Enter amount", "Enter PIN"], "tips": ["Multi-network support", "Low transaction costs", "Quick processing"]}'),

-- Côte d'Ivoire
('CI', 'MTN_MOMO', '/images/providers/mtn-momo.png', '*133#', '{"steps": ["Composez *133# sur votre téléphone MTN", "Sélectionnez Transfert dargent", "Entrez le numéro marchand", "Entrez le montant", "Confirmez avec votre PIN"], "tips": ["Service disponible 24h/24", "Réseau étendu dagents", "Transactions sécurisées"]}'),

('CI', 'ORANGE_MONEY', '/images/providers/orange-money.png', '#144#', '{"steps": ["Composez #144# sur votre téléphone Orange", "Sélectionnez Transfert", "Entrez les détails du marchand", "Entrez le montant", "Confirmez avec le code secret"], "tips": ["Interface en français", "Frais compétitifs", "Support client disponible"]}'),

-- Cameroon
('CM', 'MTN_MOMO', '/images/providers/mtn-momo.png', '*126#', '{"steps": ["Dial *126# on your MTN phone", "Select Transfer Money", "Enter merchant number", "Enter amount", "Enter PIN"], "tips": ["Bilingual service (French/English)", "Wide acceptance", "Secure transactions"]}'),

('CM', 'ORANGE_MONEY', '/images/providers/orange-money.png', '#150#', '{"steps": ["Dial #150# on your Orange phone", "Select Money Transfer", "Enter recipient details", "Enter amount", "Confirm transaction"], "tips": ["Multi-language support", "Extensive agent network", "Real-time processing"]}}');

-- Create function to get providers by country
CREATE OR REPLACE FUNCTION get_mobile_money_providers_by_country(country_code TEXT)
RETURNS TABLE (
    id UUID,
    provider TEXT,
    logo_url TEXT,
    ussd_code TEXT,
    instructions JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.provider,
        p.logo_url,
        p.ussd_code,
        p.instructions::jsonb
    FROM mobile_money_providers p
    WHERE p.country = UPPER(country_code)
    ORDER BY p.provider;
END;
$$;

-- Create function to update provider data
CREATE OR REPLACE FUNCTION update_mobile_money_provider(
    provider_id UUID,
    new_logo_url TEXT DEFAULT NULL,
    new_ussd_code TEXT DEFAULT NULL,
    new_instructions TEXT DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE mobile_money_providers SET
        logo_url = COALESCE(new_logo_url, logo_url),
        ussd_code = COALESCE(new_ussd_code, ussd_code),
        instructions = COALESCE(new_instructions, instructions),
        updated_at = NOW()
    WHERE id = provider_id;
    
    RETURN FOUND;
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE mobile_money_providers IS 'Mobile money provider details for country-specific payment options';
COMMENT ON COLUMN mobile_money_providers.country IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN mobile_money_providers.provider IS 'Mobile money provider identifier';
COMMENT ON COLUMN mobile_money_providers.logo_url IS 'URL to provider logo image';
COMMENT ON COLUMN mobile_money_providers.ussd_code IS 'USSD code to access provider services';
COMMENT ON COLUMN mobile_money_providers.instructions IS 'JSON object with payment instructions and tips'; 