import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('finlead_token');
    if (token) {
      api.get('/auth/me')
        .then(r => setUser(r.data.user))
        .catch(() => {
          // Token invalid — clear it, don't loop
          localStorage.removeItem('finlead_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    const r = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('finlead_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem('finlead_token');
    setUser(null);
  };

  const can = (screen, settings) => {
    if (!user) return false;
    const role = user.role;
    if (role === 'ADMIN' && !user._viewAs) return true;
    const perms = settings?.permissions?.[role];
    if (!perms) return false;
    return perms[screen] === 1 || perms[screen] === true;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, can, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
