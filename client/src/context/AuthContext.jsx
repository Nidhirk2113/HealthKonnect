import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState({ googleClientId: null, devAuth: false, paymentMode: 'mock' });
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cfg = await api.get('/config');
        if (alive) setConfig(cfg);
      } catch { /* the UI surfaces connectivity problems on the next request */ }
      if (tokenStore.get()) {
        try {
          const { user } = await api.get('/auth/me');
          if (alive) setUser(user);
        } catch { tokenStore.clear(); }
      }
      if (alive) setLoading(false);
    })();
    const expired = () => { tokenStore.clear(); setUser(null); };
    window.addEventListener('auth:expired', expired);
    return () => { alive = false; window.removeEventListener('auth:expired', expired); };
  }, []);

  const signIn = useCallback(({ token, user }) => { tokenStore.set(token); setUser(user); setAuthOpen(false); }, []);
  const signOut = useCallback(() => { tokenStore.clear(); setUser(null); }, []);

  const value = useMemo(
    () => ({ user, setUser, config, loading, signIn, signOut, authOpen, openAuth: () => setAuthOpen(true), closeAuth: () => setAuthOpen(false) }),
    [user, config, loading, signIn, signOut, authOpen]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
