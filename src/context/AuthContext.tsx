import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Role } from '../types';
import { api, setApiToken, getApiToken } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<void>;
  adminCodeLogin: (accessCode: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isDoctor: boolean;
  canPrescribe: boolean;
  canEditRecords: boolean;
  sessionTimeLeftMinutes: number | null;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes session timeout

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [sessionTimeLeftMinutes, setSessionTimeLeftMinutes] = useState<number | null>(null);
  const { showToast } = useToast();

  // Load current user on mount
  useEffect(() => {
    async function loadUser() {
      const token = getApiToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.getCurrentUser();
        setUser(data.user);
      } catch (err) {
        setApiToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // Listen for session expiration events from API client
  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
      showToast('warning', 'Session Expired', 'You have been automatically logged out for patient data privacy.');
    }
    window.addEventListener('ordocare:session-expired', handleSessionExpired);
    return () => window.removeEventListener('ordocare:session-expired', handleSessionExpired);
  }, [showToast]);

  // Inactivity tracking
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetActivity));

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      const remainingMs = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      setSessionTimeLeftMinutes(remainingMinutes);

      if (remainingMs <= 0) {
        // Inactivity logout
        api.logout().catch(() => {});
        setApiToken(null);
        setUser(null);
        showToast('warning', 'Session Inactivity Timeout', 'Logged out automatically after 20 minutes of inactivity to protect sensitive health data.');
      }
    }, 10000);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity));
      clearInterval(interval);
    };
  }, [user, lastActivity, resetActivity, showToast]);

  const login = async (username: string, password: string, remember: boolean = false) => {
    const data = await api.login(username, password);
    setApiToken(data.token, remember);
    setUser(data.user);
    setLastActivity(Date.now());
    sessionStorage.setItem('ordocare_just_logged_in', 'true');
    showToast('success', 'Authentication Successful', `Welcome back, ${data.user.name}`);
  };

  const adminCodeLogin = async (accessCode: string) => {
    const data = await api.adminCodeLogin(accessCode);
    setApiToken(data.token, false);
    setUser(data.user);
    setLastActivity(Date.now());
    sessionStorage.setItem('ordocare_just_logged_in', 'true');
    showToast('success', 'Master Admin Access', 'Verified administrator session granted.');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore network failure during logout
    } finally {
      sessionStorage.removeItem('ordocare_just_logged_in');
      setApiToken(null);
      setUser(null);
      showToast('info', 'Logged Out', 'Your clinical session has safely ended.');
    }
  };

  const refreshSession = () => {
    setLastActivity(Date.now());
  };

  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const canPrescribe = user?.role === 'admin' || user?.role === 'doctor';
  const canEditRecords = user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'assistant';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        adminCodeLogin,
        logout,
        isAdmin,
        isDoctor,
        canPrescribe,
        canEditRecords,
        sessionTimeLeftMinutes,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
