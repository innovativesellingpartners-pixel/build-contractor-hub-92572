import Stripe from 'https://esm.sh/stripe@14.10.0';
import { PlaidApi, Configuration, PlaidEnvironments, Products, CountryCode } from 'https://esm.sh/plaid@18.0.0';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Stripe client singleton
let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return stripeInstance;
}

// Plaid client singleton
let plaidInstance: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (!plaidInstance) {
    const clientId = Deno.env.get('PLAID_CLIENT_ID');
    const secret = Deno.env.get('PLAID_SECRET');
    const env = Deno.env.get('PLAID_ENV') || 'sandbox';
    
    if (!clientId || !secret) {
      throw new Error('PLAID_CLIENT_ID and PLAID_SECRET must be configured');
    }

    const configuration = new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    });

    plaidInstance = new PlaidApi(configuration);
  }
  return plaidInstance;
}

// Get contractor ID from authenticated user
export async function getCurrentContractorId(
  supabase: SupabaseClient,
  authHeader: string | null
): Promise<string> {
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user.id;
}

// Encrypt Plaid access token using pgcrypto
export async function encryptPlaidToken(
  supabase: SupabaseClient,
  token: string
): Promise<Uint8Array> {
  const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
  if (!encryptionKey) {
    throw new Error('QUICKBOOKS_ENCRYPTION_KEY not configured');
  }

  const { data, error } = await supabase.rpc('pgp_sym_encrypt_bytea', {
    data: token,
    key: encryptionKey,
  });

  if (error) {
    throw new Error(`Failed to encrypt token: ${error.message}`);
  }

  return data;
}

// Decrypt Plaid access token
export async function decryptPlaidToken(
  supabase: SupabaseClient,
  encrypted: Uint8Array
): Promise<string> {
  const encryptionKey = Deno.env.get('QUICKBOOKS_ENCRYPTION_KEY');
  if (!encryptionKey) {
    throw new Error('QUICKBOOKS_ENCRYPTION_KEY not configured');
  }

  const { data, error } = await supabase.rpc('pgp_sym_decrypt_bytea', {
    data: encrypted,
    key: encryptionKey,
  });

  if (error) {
    throw new Error(`Failed to decrypt token: ${error.message}`);
  }

  return data;
}

// Validate environment variables
export function validateStripeConfig() {
  const required = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'];
  const missing = required.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing required Stripe configuration: ${missing.join(', ')}`);
  }
}

export function validatePlaidConfig() {
  const required = ['PLAID_CLIENT_ID', 'PLAID_SECRET'];
  const missing = required.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing required Plaid configuration: ${missing.join(', ')}`);
  }
}
