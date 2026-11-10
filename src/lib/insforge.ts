import { createClient } from '@insforge/sdk';

const baseUrl = (import.meta.env.VITE_INSFORGE_URL as string) || 'https://pfirjd69.us-east.insforge.app';
const anonKey = (import.meta.env.VITE_INSFORGE_ANON_KEY as string) || 'ik_8a798ab90bd2bcbb33e387eec90e1bda';

export const insforge = createClient({
  baseUrl,
  anonKey,
});

export interface InsForgeUser {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

export interface MerchantProfile {
  id: string;
  user_id: string;
  merchant_upi_id: string;
  merchant_name: string;
  gmail: string;
  gmail_app_password?: string;
  api_key: string;
  mode: 'live' | 'simulation';
  enable_dynamic_amount: boolean;
  webhook_url?: string;
  session_timeout_minutes: number;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}
