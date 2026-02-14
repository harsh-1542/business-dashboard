import { getAccessToken, getRefreshToken, updateAccessToken, clearAuth } from './auth';
import { supabase } from './supabase';

// Get API base URL from environment or use default
const getApiBaseUrl = (): string => {
  try {
    // @ts-ignore - Vite provides import.meta.env
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  } catch {
    return 'http://localhost:5000/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

interface RequestOptions extends RequestInit {
  auth?: boolean;
  _retry?: boolean; // Internal flag to prevent infinite retry loops
}

// Track if we're already refreshing to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Track if we're already handling a logout to prevent infinite loops
let isLoggingOut = false;

/**
 * Attempts to refresh the access token using the refresh token
 * Returns the new access token if successful, null otherwise
 */
const refreshAccessToken = async (): Promise<string | null> => {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success && data.data?.accessToken) {
        const newAccessToken = data.data.accessToken;
        updateAccessToken(newAccessToken);
        console.log('Access token refreshed successfully');
        return newAccessToken;
      } else {
        console.warn('Failed to refresh token:', data.message || 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const handleUnauthorized = async () => {
  // Prevent multiple simultaneous logout attempts
  if (isLoggingOut) return;
  
  isLoggingOut = true;
  
  try {
    // Clear auth state
    clearAuth();
    
    // Clear Supabase session
    await supabase.auth.signOut().catch(() => {
      // Ignore errors during signout
    });
    
    console.warn('Session expired - user logged out automatically');
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Redirect to login page (only if not already on login/register or public pages)
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register' && !currentPath.startsWith('/book/') && !currentPath.startsWith('/f/')) {
      window.location.href = '/login';
    }
    
    // Reset flag after a delay
    setTimeout(() => {
      isLoggingOut = false;
    }, 1000);
  }
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Automatically add auth token if auth is not explicitly disabled
  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Handle 401 Unauthorized (token expired or invalid)
    if (res.status === 401 && options.auth !== false && !options._retry) {
      const errorMessage = (data && (data.message || data.error)) || 'Token expired';
      
      // Check if it's a token expiration/authentication error
      const isAuthError = 
        errorMessage.toLowerCase().includes('token') || 
        errorMessage.toLowerCase().includes('expired') || 
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('authentication');
      
      if (isAuthError) {
        console.warn('Access token expired, attempting to refresh...');
        
        // Try to refresh the token
        const newAccessToken = await refreshAccessToken();
        
        if (newAccessToken) {
          // Retry the original request with the new token
          console.log('Retrying request with new access token');
          return apiFetch<T>(path, {
            ...options,
            _retry: true, // Prevent infinite retry loops
            headers: {
              ...headers,
              'Authorization': `Bearer ${newAccessToken}`,
            },
          });
        } else {
          // Refresh token is also invalid/expired - log out
          console.warn('Refresh token failed - logging out');
          handleUnauthorized().catch(() => {
            // Ignore errors in logout handler
          });
          throw new Error('Your session has expired. Please log in again.');
        }
      }
    }
    
    console.log('====================================');
    console.log('Error data:', data);
    console.log('====================================');
    const message =
      (data && (data.message || data.error)) ||
      `Request failed with status ${res.status}`;

      if(data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].message);
      } 
        throw new Error(message);

  }

  return data as T;
}

