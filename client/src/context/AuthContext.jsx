import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI, setUnauthorizedHandler, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState('');

  const logout = useCallback((message = '') => {
    tokenStore.clear();
    setUser(null);
    setSessionMessage(message);
  }, []);

  // Restore the session on first load
  useEffect(() => {
    setUnauthorizedHandler((msg) => logout(msg || 'Your session has ended. Please log in again.'));
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    AuthAPI.me()
      .then((d) => setUser(d.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, [logout]);

  const handleAuth = useCallback((data) => {
    tokenStore.set(data.token);
    setUser(data.user);
    setSessionMessage('');
    return data.user;
  }, []);

  const login = useCallback((creds) => AuthAPI.login(creds).then(handleAuth), [handleAuth]);
  const register = useCallback((info) => AuthAPI.register(info).then(handleAuth), [handleAuth]);
  const changePassword = useCallback((data) => AuthAPI.changePassword(data).then(handleAuth), [handleAuth]);

  const value = useMemo(
    () => ({ user, setUser, loading, login, register, logout, changePassword, sessionMessage }),
    [user, loading, login, register, logout, changePassword, sessionMessage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
