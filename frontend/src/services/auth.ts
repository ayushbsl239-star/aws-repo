import { UserProfile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const LOCAL_STORAGE_USER_KEY = 'ai_coach_active_user';
const LOCAL_STORAGE_TOKEN_KEY = 'auth_token';

// In local mode, AWS Cognito is disabled
export const isCognitoConfigured = false;

export async function getAuthToken(): Promise<string | null> {
  return localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const token = await getAuthToken();
  if (token) {
    try {
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const user: UserProfile = {
          sub: data.sub,
          email: data.email,
          name: data.name,
        };
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
        return user;
      }
    } catch {
      // Fallback to localStorage offline
    }
  }

  const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export async function signUp(name: string, email: string, password: string): Promise<{ isSignUpComplete: boolean }> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/auth/signup`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: name,
      email: email,
      password: password,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Signup failed. Please try again.');
  }

  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.access_token);
  }
  if (data.user) {
    const user: UserProfile = {
      sub: data.user.sub,
      email: data.user.email,
      name: data.user.name,
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  }

  return { isSignUpComplete: true };
}

export async function confirmSignUp(email: string, confirmationCode: string): Promise<boolean> {
  return true;
}

export async function signIn(email: string, password: string): Promise<UserProfile> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Invalid email or password.');
  }

  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.access_token);
  }

  const user: UserProfile = {
    sub: data.user.sub,
    email: data.user.email,
    name: data.user.name,
  };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  return user;
}

export async function signOut(): Promise<void> {
  localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
}
