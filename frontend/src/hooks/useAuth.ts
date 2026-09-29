import { useEffect, useState } from 'react';
import { getCurrentUser, signIn as authSignIn, signOut as authSignOut, signUp as authSignUp, confirmSignUp as authConfirmSignUp } from '../services/auth';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const u = await getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, pass: string) {
    setLoading(true);
    try {
      const u = await authSignIn(email, pass);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }

  async function register(name: string, email: string, pass: string) {
    setLoading(true);
    try {
      return await authSignUp(name, email, pass);
    } finally {
      setLoading(false);
    }
  }

  async function verify(email: string, code: string) {
    return await authConfirmSignUp(email, code);
  }

  async function logout() {
    await authSignOut();
    setUser(null);
  }

  return {
    user,
    loading,
    login,
    register,
    verify,
    logout,
    refreshUser: checkUser,
  };
}
