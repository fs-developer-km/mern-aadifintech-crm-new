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
    localStorage.removeItem('finlead_admin_token');
    setUser(null);
  };

  // 🆕 Admin kisi RM/Manager ko "view as" karta hai — asli JWT switch hota hai
  const viewAs = async (userId) => {
    const currentToken = localStorage.getItem('finlead_token');
    const r = await api.post(`/auth/impersonate/${userId}`);
    // Admin ka original token safe rakho, taki "Restore Admin" kaam kare
    localStorage.setItem('finlead_admin_token', currentToken);
    localStorage.setItem('finlead_token', r.data.token);
    setUser({ ...r.data.user, _viewAs: true });
  };

  // 🆕 Admin token wapas restore karo
  const restoreAdmin = async () => {
    const adminToken = localStorage.getItem('finlead_admin_token');
    if (!adminToken) return;
    localStorage.setItem('finlead_token', adminToken);
    localStorage.removeItem('finlead_admin_token');
    const r = await api.get('/auth/me');
    setUser(r.data.user);
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
    <AuthContext.Provider value={{ user, setUser, login, logout, can, loading, viewAs, restoreAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);