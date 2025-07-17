/**
 * Location and Mobile Money Provider API Routes
 * Handles server-side location detection and provider management
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import requestIp from 'request-ip';
import axios from 'axios';

const router = Router();

interface LocationDetectionResponse {
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
  ip?: string;
  source: string;
}

interface MobileMoneyProvider {
  id: string;
  provider: string;
  logo_url: string;
  ussd_code: string;
  instructions: any;
}

/**
 * Detect user location based on IP address
 * Uses multiple GeoIP services for reliability
 */
router.get('/detect', async (req: Request, res: Response) => {
  try {
    const clientIp = requestIp.getClientIp(req) || req.ip;
    const forwardedIp = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    
    // Use the most reliable IP source
    const detectionIp = forwardedIp?.split(',')[0] || realIp || clientIp || '127.0.0.1';
    
    console.log(`Detecting location for IP: ${detectionIp}`);
    
    // Skip local IPs
    if (detectionIp === '127.0.0.1' || detectionIp === '::1' || detectionIp?.startsWith('192.168.')) {
      return res.json({
        country: 'Nigeria', // Default for development
        countryCode: 'NG',
        city: 'Lagos',
        ip: detectionIp,
        source: 'default'
      });
    }

    // Try multiple GeoIP services
    const providers = [
      {
        name: 'ipapi',
        detect: async (ip: string) => {
          const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,query`);
          const data = response.data;
          if (data.status === 'success') {
            return {
              country: data.country,
              countryCode: data.countryCode,
              city: data.city,
              region: data.regionName,
              ip: data.query,
              source: 'ip-api'
            };
          }
          return null;
        }
      },
      {
        name: 'ipinfo',
        detect: async (ip: string) => {
          const token = process.env.IPINFO_API_KEY;
          const url = token 
            ? `https://ipinfo.io/${ip}?token=${token}`
            : `https://ipinfo.io/${ip}/json`;
          
          const response = await axios.get(url);
          const data = response.data;
          
          return {
            country: data.country_name || data.country,
            countryCode: data.country,
            city: data.city,
            region: data.region,
            ip: data.ip,
            source: 'ipinfo'
          };
        }
      }
    ];

    // Try each provider
    for (const provider of providers) {
      try {
        const result = await provider.detect(detectionIp);
        if (result && result.countryCode) {
          console.log(`Location detected by ${provider.name}:`, result);
          return res.json(result);
        }
      } catch (error) {
        console.warn(`${provider.name} failed:`, error);
      }
    }

    // Fallback
    res.json({
      country: 'Nigeria',
      countryCode: 'NG',
      city: 'Lagos',
      ip: detectionIp,
      source: 'fallback'
    });

  } catch (error) {
    console.error('Location detection error:', error);
    res.status(500).json({
      error: 'Failed to detect location',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get mobile money providers for a specific country
 */
router.get('/providers/:countryCode', async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.params;
    
    if (!countryCode || countryCode.length !== 2) {
      return res.status(400).json({
        error: 'Invalid country code',
        message: 'Country code must be a 2-letter ISO code'
      });
    }

    const { data: providers, error } = await supabase
      .from('mobile_money_providers')
      .select('*')
      .eq('country', countryCode.toUpperCase())
      .order('provider');

    if (error) {
      throw error;
    }

    res.json({
      countryCode: countryCode.toUpperCase(),
      providers: providers || [],
      count: providers?.length || 0
    });

  } catch (error) {
    console.error('Failed to fetch providers:', error);
    res.status(500).json({
      error: 'Failed to fetch providers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all supported countries with their providers
 */
router.get('/countries', async (req: Request, res: Response) => {
  try {
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('code, name, currency, is_supported, yellowcard_supported')
      .eq('is_supported', true)
      .order('name');

    if (countriesError) {
      throw countriesError;
    }

    // Get provider counts for each country
    const { data: providerCounts, error: countsError } = await supabase
      .from('mobile_money_providers')
      .select('country, provider')
      .order('country');

    if (countsError) {
      throw countsError;
    }

    // Group providers by country
    const providersByCountry = (providerCounts || []).reduce((acc: Record<string, number>, item) => {
      acc[item.country] = (acc[item.country] || 0) + 1;
      return acc;
    }, {});

    // Combine data
    const result = (countries || []).map(country => ({
      ...country,
      providerCount: providersByCountry[country.code] || 0
    }));

    res.json({
      countries: result,
      total: result.length
    });

  } catch (error) {
    console.error('Failed to fetch countries:', error);
    res.status(500).json({
      error: 'Failed to fetch countries',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get provider details by ID
 */
router.get('/provider/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;

    const { data: provider, error } = await supabase
      .from('mobile_money_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Provider not found'
        });
      }
      throw error;
    }

    res.json(provider);

  } catch (error) {
    console.error('Failed to fetch provider:', error);
    res.status(500).json({
      error: 'Failed to fetch provider',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Search providers by name or country
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, country } = req.query;

    let query = supabase.from('mobile_money_providers').select('*');

    if (country) {
      query = query.eq('country', (country as string).toUpperCase());
    }

    if (q) {
      query = query.ilike('provider', `%${q}%`);
    }

    const { data: providers, error } = await query.order('provider');

    if (error) {
      throw error;
    }

    res.json({
      query: { q, country },
      providers: providers || [],
      count: providers?.length || 0
    });

  } catch (error) {
    console.error('Failed to search providers:', error);
    res.status(500).json({
      error: 'Failed to search providers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update provider information (Admin only)
 */
router.put('/provider/:providerId', async (req: Request, res: Response) => {
  try {
    // Add authentication middleware check here
    // const userRole = req.user?.role;
    // if (userRole !== 'admin') {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const { providerId } = req.params;
    const { logo_url, ussd_code, instructions } = req.body;

    const updateData: any = {};
    if (logo_url) updateData.logo_url = logo_url;
    if (ussd_code) updateData.ussd_code = ussd_code;
    if (instructions) updateData.instructions = instructions;
    updateData.updated_at = new Date().toISOString();

    const { data: provider, error } = await supabase
      .from('mobile_money_providers')
      .update(updateData)
      .eq('id', providerId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Provider not found'
        });
      }
      throw error;
    }

    res.json({
      message: 'Provider updated successfully',
      provider
    });

  } catch (error) {
    console.error('Failed to update provider:', error);
    res.status(500).json({
      error: 'Failed to update provider',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      geoip: 'available'
    }
  });
});

export default router; 