import { Amplify } from 'aws-amplify';
import {
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession as amplifyFetchAuthSession,
} from 'aws-amplify/auth';
import { UserProfile } from '../types';
import { DEMO_USER } from './demoData';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;
const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

export const isCognitoConfigured = Boolean(userPoolId && userPoolClientId);

if (isCognitoConfigured && userPoolId && userPoolClientId) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      },
    },
  });
}

// In-memory demo auth state for local test & judge preview
const LOCAL_STORAGE_USER_KEY = 'ai_coach_active_user';

export async function getCurrentUser(): Promise<UserProfile | null> {
  if (isCognitoConfigured) {
    try {
      const user = await amplifyGetCurrentUser();
      const session = await amplifyFetchAuthSession();
      const claims = session.tokens?.idToken?.payload;
      return {
        sub: user.userId,
        email: (claims?.email as string) || user.username,
        name: (claims?.name as string) || (claims?.fullname as string) || user.username,
      };
    } catch {
      return null;
    }
  }

  // Demo fallback
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

export async function getAuthToken(): Promise<string | null> {
  if (isCognitoConfigured) {
    try {
      const session = await amplifyFetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch {
      return null;
    }
  }
  const user = await getCurrentUser();
  if (user) {
    // Generate a structured mock JWT header/payload so backend authorizer can parse sub/email
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: user.sub, email: user.email, name: user.name }));
    return `${header}.${payload}.signature`;
  }
  return null;
}

export async function signUp(name: string, email: string, password: string): Promise<{ isSignUpComplete: boolean }> {
  if (isCognitoConfigured) {
    const output = await amplifySignUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          fullname: name,
        },
      },
    });
    return { isSignUpComplete: output.isSignUpComplete };
  }

  // Demo mode immediate simulated signup
  const demoUser: UserProfile = {
    sub: `user_${Date.now()}`,
    email,
    name,
  };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser));
  return { isSignUpComplete: true };
}

export async function confirmSignUp(email: string, confirmationCode: string): Promise<boolean> {
  if (isCognitoConfigured) {
    const res = await amplifyConfirmSignUp({
      username: email,
      confirmationCode,
    });
    return res.isSignUpComplete;
  }
  return true;
}

export async function signIn(email: string, password: string): Promise<UserProfile> {
  if (isCognitoConfigured) {
    await amplifySignIn({ username: email, password });
    const user = await getCurrentUser();
    if (!user) throw new Error('Failed to retrieve user attributes after login.');
    return user;
  }

  // Demo mode
  const user: UserProfile = {
    sub: DEMO_USER.sub,
    email: email || DEMO_USER.email,
    name: email ? email.split('@')[0] : DEMO_USER.name,
  };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  return user;
}

export async function signOut(): Promise<void> {
  if (isCognitoConfigured) {
    await amplifySignOut();
  }
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
}
