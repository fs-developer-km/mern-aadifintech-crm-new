import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [msg, setMsg] = useState('');

  const toast = useCallback((text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {msg && <div className="toast">{msg}</div>}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
