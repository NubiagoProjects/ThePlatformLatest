/**
 * GeoIP Service for Country Detection
 * Supports multiple providers with fallback mechanisms
 */

export interface LocationData {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  ip?: string;
  timezone?: string;
  currency?: string;
}

export interface GeoIPProvider {
  name: string;
  detect: () => Promise<LocationData | null>;
}

// IPInfo.io provider (free tier: 50k requests/month)
class IPInfoProvider implements GeoIPProvider {
  name = 'ipinfo';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async detect(): Promise<LocationData | null> {
    try {
      const url = this.apiKey 
        ? `https://ipinfo.io?token=${this.apiKey}`
        : 'https://ipinfo.io/json';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('IPInfo request failed');
      
      const data = await response.json();
      
      return {
        country: data.country_name || data.country,
        countryCode: data.country,
        region: data.region,
        city: data.city,
        ip: data.ip,
        timezone: data.timezone
      };
    } catch (error) {
      console.warn('IPInfo detection failed:', error);
      return null;
    }
  }
}

// IP-API provider (free: 1000 requests/hour)
class IPAPIProvider implements GeoIPProvider {
  name = 'ip-api';

  async detect(): Promise<LocationData | null> {
    try {
      const response = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,regionName,city,timezone,currency,query');
      if (!response.ok) throw new Error('IP-API request failed');
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error('IP-API returned error status');
      }
      
      return {
        country: data.country,
        countryCode: data.countryCode,
        region: data.regionName,
        city: data.city,
        ip: data.query,
        timezone: data.timezone,
        currency: data.currency
      };
    } catch (error) {
      console.warn('IP-API detection failed:', error);
      return null;
    }
  }
}

// Cloudflare trace (very reliable, no limits)
class CloudflareProvider implements GeoIPProvider {
  name = 'cloudflare';

  async detect(): Promise<LocationData | null> {
    try {
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      if (!response.ok) throw new Error('Cloudflare trace failed');
      
      const text = await response.text();
      const data: Record<string, string> = {};
      
      text.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) data[key] = value;
      });
      
      if (!data.loc) throw new Error('No location data from Cloudflare');
      
      // Convert country code to full name (basic mapping)
      const countryNames: Record<string, string> = {
        'NG': 'Nigeria', 'KE': 'Kenya', 'UG': 'Uganda', 'GH': 'Ghana',
        'TZ': 'Tanzania', 'ZA': 'South Africa', 'SN': 'Senegal',
        'BF': 'Burkina Faso', 'TG': 'Togo', 'CI': 'Côte dIvoire',
        'CM': 'Cameroon', 'US': 'United States', 'GB': 'United Kingdom',
        'FR': 'France', 'DE': 'Germany', 'CA': 'Canada'
      };
      
      return {
        country: countryNames[data.loc] || data.loc,
        countryCode: data.loc,
        ip: data.ip
      };
    } catch (error) {
      console.warn('Cloudflare detection failed:', error);
      return null;
    }
  }
}

// Browser geolocation fallback
class BrowserLocationProvider implements GeoIPProvider {
  name = 'browser-geolocation';

  async detect(): Promise<LocationData | null> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return null;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 10000);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeout);
          try {
            // Reverse geocoding using a free service
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            
            if (response.ok) {
              const data = await response.json();
              resolve({
                country: data.countryName,
                countryCode: data.countryCode,
                region: data.principalSubdivision,
                city: data.city
              });
            } else {
              resolve(null);
            }
          } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            resolve(null);
          }
        },
        () => {
          clearTimeout(timeout);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  }
}

// Main GeoIP service class
export class GeoIPService {
  private providers: GeoIPProvider[];
  private cache: LocationData | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor(ipinfoApiKey?: string) {
    this.providers = [
      new CloudflareProvider(),
      new IPInfoProvider(ipinfoApiKey),
      new IPAPIProvider(),
      new BrowserLocationProvider()
    ];
  }

  /**
   * Detect user location with fallback providers
   */
  async detectLocation(): Promise<LocationData | null> {
    // Return cached result if still valid
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    // Try each provider in order
    for (const provider of this.providers) {
      try {
        const result = await provider.detect();
        if (result && result.countryCode) {
          // Cache successful result
          this.cache = result;
          this.cacheExpiry = Date.now() + this.CACHE_DURATION;
          
          console.log(`Location detected by ${provider.name}:`, result);
          return result;
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
      }
    }

    console.warn('All GeoIP providers failed');
    return null;
  }

  /**
   * Get user's country code
   */
  async getCountryCode(): Promise<string | null> {
    const location = await this.detectLocation();
    return location?.countryCode || null;
  }

  /**
   * Check if user is in a supported African country
   */
  async isInSupportedRegion(): Promise<boolean> {
    const countryCode = await this.getCountryCode();
    if (!countryCode) return false;

    const supportedCountries = [
      'NG', 'KE', 'UG', 'GH', 'TZ', 'ZA', 'SN', 'BF', 'TG', 'CI', 'CM',
      'MA', 'EG', 'ET', 'DZ', 'AO', 'MZ', 'MG', 'CD', 'ZW', 'ZM', 'MW',
      'RW', 'BI', 'DJ', 'SO', 'ER', 'SS', 'SD', 'TD', 'CF', 'CG', 'GA',
      'GQ', 'ST', 'CV', 'GM', 'GW', 'SL', 'LR', 'ML', 'NE', 'MR', 'LY', 'TN'
    ];

    return supportedCountries.includes(countryCode);
  }

  /**
   * Clear cached location data
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Get cached location without making new requests
   */
  getCachedLocation(): LocationData | null {
    return this.cache && Date.now() < this.cacheExpiry ? this.cache : null;
  }
}

// Export singleton instance
export const geoIPService = new GeoIPService(process.env.NEXT_PUBLIC_IPINFO_API_KEY);

// Helper function for easy access
export const detectUserCountry = async (): Promise<string | null> => {
  return await geoIPService.getCountryCode();
};

// Helper function to check if in supported region
export const isUserInSupportedRegion = async (): Promise<boolean> => {
  return await geoIPService.isInSupportedRegion();
}; 