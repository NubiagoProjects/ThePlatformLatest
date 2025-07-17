/**
 * Enhanced GeoIP Service with Provider Auto-Selection and User Profile Personalization
 * Detects user's country, auto-selects mobile money providers, and saves preferences
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface GeoIPResult {
  success: boolean;
  country?: string;
  countryName?: string;
  region?: string;
  city?: string;
  timezone?: string;
  currency?: string;
  ip?: string;
  isp?: string;
  confidence?: number;
  source?: string;
  error?: string;
}

interface CountryProvider {
  id: string;
  name: string;
  logo: string;
  ussd_code: string;
  phone_pattern: string;
  countries: string[];
  market_share?: number;
  recommended?: boolean;
}

interface UserProfile {
  user_id: string;
  country_code?: string;
  detected_country?: string;
  preferred_currency?: string;
  preferred_provider?: string;
  phone_country_code?: string;
  timezone?: string;
  language?: string;
  geoip_data?: any;
  auto_approve_withdrawals?: boolean;
  withdrawal_limits?: {
    daily: number;
    monthly: number;
  };
}

interface EnhancedGeoIPResponse extends GeoIPResult {
  recommendedProviders?: CountryProvider[];
  primaryProvider?: CountryProvider;
  profileUpdated?: boolean;
  userPreferences?: UserProfile;
}

// Country-to-provider mapping with market share data
const COUNTRY_PROVIDER_MAP: Record<string, CountryProvider[]> = {
  'KE': [
    {
      id: 'mpesa-ke',
      name: 'M-Pesa',
      logo: '/images/providers/mpesa.png',
      ussd_code: '*334#',
      phone_pattern: '^254[0-9]{9}$',
      countries: ['KE'],
      market_share: 85,
      recommended: true
    },
    {
      id: 'airtel-ke',
      name: 'Airtel Money',
      logo: '/images/providers/airtel.png',
      ussd_code: '*185#',
      phone_pattern: '^254[0-9]{9}$',
      countries: ['KE'],
      market_share: 12,
      recommended: false
    }
  ],
  'UG': [
    {
      id: 'mtn-ug',
      name: 'MTN MoMo',
      logo: '/images/providers/mtn.png',
      ussd_code: '*170#',
      phone_pattern: '^256[0-9]{9}$',
      countries: ['UG'],
      market_share: 60,
      recommended: true
    },
    {
      id: 'airtel-ug',
      name: 'Airtel Money',
      logo: '/images/providers/airtel.png',
      ussd_code: '*185#',
      phone_pattern: '^256[0-9]{9}$',
      countries: ['UG'],
      market_share: 35,
      recommended: false
    }
  ],
  'NG': [
    {
      id: 'opay-ng',
      name: 'OPay',
      logo: '/images/providers/opay.png',
      ussd_code: '*955#',
      phone_pattern: '^234[0-9]{10}$',
      countries: ['NG'],
      market_share: 40,
      recommended: true
    },
    {
      id: 'palmpay-ng',
      name: 'PalmPay',
      logo: '/images/providers/palmpay.png',
      ussd_code: '*861#',
      phone_pattern: '^234[0-9]{10}$',
      countries: ['NG'],
      market_share: 30,
      recommended: false
    }
  ],
  'TZ': [
    {
      id: 'vodacom-tz',
      name: 'M-Pesa Tanzania',
      logo: '/images/providers/mpesa-tz.png',
      ussd_code: '*150*00#',
      phone_pattern: '^255[0-9]{9}$',
      countries: ['TZ'],
      market_share: 70,
      recommended: true
    },
    {
      id: 'airtel-tz',
      name: 'Airtel Money',
      logo: '/images/providers/airtel.png',
      ussd_code: '*150*60#',
      phone_pattern: '^255[0-9]{9}$',
      countries: ['TZ'],
      market_share: 25,
      recommended: false
    }
  ],
  'GH': [
    {
      id: 'mtn-gh',
      name: 'MTN MoMo',
      logo: '/images/providers/mtn.png',
      ussd_code: '*170#',
      phone_pattern: '^233[0-9]{9}$',
      countries: ['GH'],
      market_share: 65,
      recommended: true
    },
    {
      id: 'vodafone-gh',
      name: 'Vodafone Cash',
      logo: '/images/providers/vodafone.png',
      ussd_code: '*110#',
      phone_pattern: '^233[0-9]{9}$',
      countries: ['GH'],
      market_share: 25,
      recommended: false
    }
  ]
};

// Currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'KE': 'KES',
  'UG': 'UGX',
  'NG': 'NGN',
  'TZ': 'TZS',
  'GH': 'GHS',
  'ZA': 'ZAR',
  'SN': 'XOF',
  'BF': 'XOF',
  'TG': 'XOF',
  'CI': 'XOF',
  'CM': 'XAF'
};

export class EnhancedGeoIPService {
  private static instance: EnhancedGeoIPService;
  private cache: Map<string, EnhancedGeoIPResponse> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): EnhancedGeoIPService {
    if (!EnhancedGeoIPService.instance) {
      EnhancedGeoIPService.instance = new EnhancedGeoIPService();
    }
    return EnhancedGeoIPService.instance;
  }

  /**
   * Enhanced GeoIP detection with provider auto-selection and profile saving
   */
  async detectLocationAndProviders(
    userId?: string,
    options: {
      updateProfile?: boolean;
      forceRefresh?: boolean;
      includeProviders?: boolean;
    } = {}
  ): Promise<EnhancedGeoIPResponse> {
    const {
      updateProfile = true,
      forceRefresh = false,
      includeProviders = true
    } = options;

    try {
      // Check cache first
      const cacheKey = `geoip_${userId || 'anonymous'}`;
      if (!forceRefresh && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        if (Date.now() - (cached as any).timestamp < this.CACHE_DURATION) {
          return cached;
        }
      }

      // Get basic GeoIP data
      const geoipResult = await this.performGeoIPLookup();
      
      if (!geoipResult.success || !geoipResult.country) {
        return {
          success: false,
          error: 'Could not detect location',
          recommendedProviders: [],
          profileUpdated: false
        };
      }

      const response: EnhancedGeoIPResponse = {
        ...geoipResult,
        recommendedProviders: [],
        primaryProvider: undefined,
        profileUpdated: false
      };

      // Get providers for detected country
      if (includeProviders && geoipResult.country) {
        const providers = this.getProvidersForCountry(geoipResult.country);
        response.recommendedProviders = providers;
        response.primaryProvider = providers.find(p => p.recommended) || providers[0];
      }

      // Update user profile if user is authenticated
      if (userId && updateProfile) {
        try {
          const profileData: Partial<UserProfile> = {
            user_id: userId,
            country_code: geoipResult.country,
            detected_country: geoipResult.countryName,
            preferred_currency: COUNTRY_CURRENCY_MAP[geoipResult.country] || 'USD',
            timezone: geoipResult.timezone,
            geoip_data: {
              ip: geoipResult.ip,
              city: geoipResult.city,
              region: geoipResult.region,
              isp: geoipResult.isp,
              detected_at: new Date().toISOString(),
              source: geoipResult.source,
              confidence: geoipResult.confidence
            }
          };

          // Set preferred provider if not already set
          if (response.primaryProvider) {
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('preferred_provider')
              .eq('user_id', userId)
              .single();

            if (!existingProfile?.preferred_provider) {
              profileData.preferred_provider = response.primaryProvider.id;
            }
          }

          const { error: profileError } = await supabase
            .rpc('update_user_geoip_profile', {
              p_user_id: userId,
              p_country_code: geoipResult.country,
              p_detected_country: geoipResult.countryName,
              p_geoip_data: profileData.geoip_data,
              p_preferred_provider: profileData.preferred_provider
            });

          if (!profileError) {
            response.profileUpdated = true;
          }

          // Get updated user preferences
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (userProfile) {
            response.userPreferences = userProfile;
            
            // Update primary provider based on user preference
            if (userProfile.preferred_provider && response.recommendedProviders) {
              const preferredProvider = response.recommendedProviders.find(
                p => p.id === userProfile.preferred_provider
              );
              if (preferredProvider) {
                response.primaryProvider = preferredProvider;
              }
            }
          }

        } catch (profileError) {
          console.error('Error updating user profile:', profileError);
          // Don't fail the entire request for profile update errors
        }
      }

      // Cache the result
      (response as any).timestamp = Date.now();
      this.cache.set(cacheKey, response);

      return response;

    } catch (error) {
      console.error('Enhanced GeoIP detection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recommendedProviders: [],
        profileUpdated: false
      };
    }
  }

  /**
   * Get user's saved preferences and apply them
   */
  async getUserPreferences(userId: string): Promise<{
    success: boolean;
    preferences?: UserProfile;
    recommendedProviders?: CountryProvider[];
    primaryProvider?: CountryProvider;
  }> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !profile) {
        return { success: false };
      }

      let recommendedProviders: CountryProvider[] = [];
      let primaryProvider: CountryProvider | undefined;

      if (profile.country_code) {
        recommendedProviders = this.getProvidersForCountry(profile.country_code);
        
        if (profile.preferred_provider) {
          primaryProvider = recommendedProviders.find(p => p.id === profile.preferred_provider);
        }
        
        if (!primaryProvider) {
          primaryProvider = recommendedProviders.find(p => p.recommended) || recommendedProviders[0];
        }
      }

      return {
        success: true,
        preferences: profile,
        recommendedProviders,
        primaryProvider
      };

    } catch (error) {
      console.error('Error getting user preferences:', error);
      return { success: false };
    }
  }

  /**
   * Update user's preferred provider
   */
  async updateUserProvider(userId: string, providerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          preferred_provider: providerId,
          updated_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error updating user provider:', error);
      return false;
    }
  }

  /**
   * Get providers for a specific country
   */
  getProvidersForCountry(countryCode: string): CountryProvider[] {
    const providers = COUNTRY_PROVIDER_MAP[countryCode] || [];
    return providers.sort((a, b) => (b.market_share || 0) - (a.market_share || 0));
  }

  /**
   * Get country currency
   */
  getCountryCurrency(countryCode: string): string {
    return COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
  }

  /**
   * Perform multi-provider GeoIP lookup with fallback
   */
  private async performGeoIPLookup(): Promise<GeoIPResult> {
    const providers = [
      () => this.detectViaCloudflare(),
      () => this.detectViaIPInfo(),
      () => this.detectViaIPAPI(),
      () => this.detectViaBrowser()
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (result.success && result.country) {
          return result;
        }
      } catch (error) {
        console.warn('GeoIP provider failed:', error);
        continue;
      }
    }

    return {
      success: false,
      error: 'All GeoIP providers failed'
    };
  }

  /**
   * Cloudflare GeoIP detection
   */
  private async detectViaCloudflare(): Promise<GeoIPResult> {
    try {
      const response = await fetch('/api/location/detect', {
        method: 'GET',
        headers: {
          'CF-IPCountry': 'true'
        }
      });

      if (!response.ok) throw new Error('Cloudflare detection failed');

      const data = await response.json();
      
      return {
        success: true,
        country: data.country,
        countryName: data.countryName,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        ip: data.ip,
        confidence: 90,
        source: 'cloudflare'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Cloudflare detection failed',
        source: 'cloudflare'
      };
    }
  }

  /**
   * IPInfo.io detection
   */
  private async detectViaIPInfo(): Promise<GeoIPResult> {
    try {
      const response = await fetch('https://ipinfo.io/json?token=your_token_here');
      const data = await response.json();

      return {
        success: true,
        country: data.country,
        countryName: data.country,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        ip: data.ip,
        isp: data.org,
        confidence: 85,
        source: 'ipinfo'
      };
    } catch (error) {
      return {
        success: false,
        error: 'IPInfo detection failed',
        source: 'ipinfo'
      };
    }
  }

  /**
   * IP-API detection
   */
  private async detectViaIPAPI(): Promise<GeoIPResult> {
    try {
      const response = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,region,city,timezone,isp,query');
      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error('IP-API failed');
      }

      return {
        success: true,
        country: data.countryCode,
        countryName: data.country,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        ip: data.query,
        isp: data.isp,
        confidence: 80,
        source: 'ip-api'
      };
    } catch (error) {
      return {
        success: false,
        error: 'IP-API detection failed',
        source: 'ip-api'
      };
    }
  }

  /**
   * Browser-based detection fallback
   */
  private async detectViaBrowser(): Promise<GeoIPResult> {
    try {
      // Try to get timezone-based country detection
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const countryFromTZ = this.getCountryFromTimezone(timezone);

      if (countryFromTZ) {
        return {
          success: true,
          country: countryFromTZ.code,
          countryName: countryFromTZ.name,
          timezone: timezone,
          confidence: 60,
          source: 'browser'
        };
      }

      throw new Error('Browser detection failed');
    } catch (error) {
      return {
        success: false,
        error: 'Browser detection failed',
        source: 'browser'
      };
    }
  }

  /**
   * Get country from timezone (fallback method)
   */
  private getCountryFromTimezone(timezone: string): { code: string; name: string } | null {
    const timezoneMap: Record<string, { code: string; name: string }> = {
      'Africa/Nairobi': { code: 'KE', name: 'Kenya' },
      'Africa/Kampala': { code: 'UG', name: 'Uganda' },
      'Africa/Lagos': { code: 'NG', name: 'Nigeria' },
      'Africa/Dar_es_Salaam': { code: 'TZ', name: 'Tanzania' },
      'Africa/Accra': { code: 'GH', name: 'Ghana' },
      'Africa/Johannesburg': { code: 'ZA', name: 'South Africa' }
    };

    return timezoneMap[timezone] || null;
  }
}

// Export singleton instance
export const geoipService = EnhancedGeoIPService.getInstance();

// Convenience functions
export async function detectUserLocationAndProviders(
  userId?: string,
  options?: Parameters<typeof geoipService.detectLocationAndProviders>[1]
): Promise<EnhancedGeoIPResponse> {
  return geoipService.detectLocationAndProviders(userId, options);
}

export async function getUserPreferences(userId: string) {
  return geoipService.getUserPreferences(userId);
}

export async function updateUserProvider(userId: string, providerId: string): Promise<boolean> {
  return geoipService.updateUserProvider(userId, providerId);
}

export function getProvidersForCountry(countryCode: string): CountryProvider[] {
  return geoipService.getProvidersForCountry(countryCode);
}

export function getCountryCurrency(countryCode: string): string {
  return geoipService.getCountryCurrency(countryCode);
} 