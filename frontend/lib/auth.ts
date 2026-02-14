import { supabase } from './supabase';
import { apiFetch } from './api';

export const ACCESS_TOKEN_KEY = 'careops_access_token';
export const REFRESH_TOKEN_KEY = 'careops_refresh_token';
export const USER_KEY = 'careops_user';

export type AuthUser = {
  // Supabase and your backend both use UUID strings
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthPayload = {
  user: AuthUser;
  tokens: AuthTokens;
};

export const saveAuth = (payload: AuthPayload) => {
  const { user, tokens } = payload;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const updateAccessToken = (accessToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
};

export const getCurrentUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

type SupabaseLoginResponse = {
  success: boolean;
  message: string;
  data: AuthPayload;
};

/**
 * Sync local CareOps auth (careops_*) from an existing Supabase session.
 * - If we already have a CareOps access token, this is a no-op.
 * - If Supabase has a valid session, we call /auth/supabase to get
 *   { user, tokens } in the same shape as email/password login and persist it.
 * Returns true if we ended up authenticated, false otherwise.
 */
export const syncAuthFromSupabase = async (): Promise<boolean> => {
  // Already have local auth; nothing to do.
  if (isAuthenticated()) return true;

  const { data, error } = await supabase.auth.getSession();

  if (error || !data?.session?.access_token) {
    return false;
  }

  const supabaseAccessToken = data.session.access_token;

  try {
    const response = await apiFetch<SupabaseLoginResponse>('/auth/supabase', {
      method: 'POST',
      body: JSON.stringify({ accessToken: supabaseAccessToken }),
    });

    saveAuth(response.data);
    return true;
  } catch (err) {
    console.error('Failed to sync auth from Supabase', err);
    return false;
  }
};

