import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.set(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me()
      .then((r) => setProfile(r.profile))
      .catch(() => tokenStore.set(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('spl:unauthorized', onUnauthorized);
    return () => window.removeEventListener('spl:unauthorized', onUnauthorized);
  }, [logout]);

  const login = useCallback(async (loginId, password) => {
    const r = await api.login({ login: loginId, password });
    tokenStore.set(r.token);
    setProfile(r.profile);
    return r.profile;
  }, []);

  const register = useCallback(async (data) => {
    const r = await api.register(data);
    tokenStore.set(r.token);
    setProfile(r.profile);
    return r.profile;
  }, []);

  const refresh = useCallback(async () => {
    const r = await api.me();
    setProfile(r.profile);
    return r.profile;
  }, []);

  const value = useMemo(
    () => ({ profile, setProfile, loading, login, register, logout, refresh, isAdmin: profile?.accountType === 'admin' }),
    [profile, loading, login, register, logout, refresh]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
