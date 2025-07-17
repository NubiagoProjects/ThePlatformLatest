import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://gwcngnbugrfavejmvcnq.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3Y25nbmJ1Z3JmYXZlam12Y25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NjUzMTQsImV4cCI6MjA2ODI0MTMxNH0.OHozj3ERsXyih5QYM1rc7hfqFZWvfhofx8uR344WcXU';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Supabase client for public operations
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // We'll handle sessions manually
    detectSessionInUrl: false
  }
});

// Create Supabase admin client for backend operations
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database configuration for direct PostgreSQL connection
export const supabaseDatabase = {
  connectionString: process.env.SUPABASE_DB_URL || 'postgresql://postgres.gwcngnbugrfavejmvcnq:[Numara96756939/*-]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
  ssl: true
};

// Supabase configuration object
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceKey: supabaseServiceKey,
  
  // Storage bucket configuration
  storage: {
    productImages: 'product-images',
    userAvatars: 'user-avatars',
    orderDocuments: 'order-documents'
  },
  
  // Auth configuration
  auth: {
    site_url: process.env.FRONTEND_URL || 'http://localhost:3000',
    redirect_urls: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000'
    ]
  }
};

// Helper function to get authenticated user from Supabase
export const getSupabaseUser = async (accessToken: string) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      throw error;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting Supabase user:', error);
    return null;
  }
};

// Helper function to create Supabase client with user session
export const createSupabaseClient = (accessToken?: string) => {
  if (!accessToken) {
    return supabase;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
};

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // Test database connection
    const { data: _data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is expected before migration
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return false;
  }
};

// Initialize Supabase storage buckets
export const initializeSupabaseStorage = async () => {
  try {
    console.log('🔄 Initializing Supabase storage buckets...');
    
    const buckets = [
      { name: 'product-images', public: true },
      { name: 'user-avatars', public: true },
      { name: 'order-documents', public: false }
    ];
    
    for (const bucket of buckets) {
      const { data: existingBucket } = await supabaseAdmin.storage.getBucket(bucket.name);
      
      if (!existingBucket) {
        const { error } = await supabaseAdmin.storage.createBucket(bucket.name, {
          public: bucket.public,
          allowedMimeTypes: bucket.name === 'order-documents' 
            ? ['application/pdf', 'image/jpeg', 'image/png']
            : ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: bucket.name === 'order-documents' ? 10485760 : 5242880 // 10MB for documents, 5MB for images
        });
        
        if (error) {
          console.error(`❌ Failed to create bucket ${bucket.name}:`, error);
        } else {
          console.log(`✅ Created storage bucket: ${bucket.name}`);
        }
      } else {
        console.log(`✅ Storage bucket already exists: ${bucket.name}`);
      }
    }
    
    console.log('✅ Supabase storage initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase storage:', error);
  }
};

export default supabase; 