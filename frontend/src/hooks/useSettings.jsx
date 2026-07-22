import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { PRODUCT_TREE, STAGES, SOURCES, DEFAULT_EXTRA_ROLES } from '../utils/constants.js';

const SettingsContext = createContext(null);

const DEFAULTS = {
  org: { name: 'Aadi Fintech Financial Hub', branch: 'Noida Sector 62', accent: '#0f766e' },
  custom: {
    statuses: STAGES, products: PRODUCT_TREE, sources: SOURCES,
    documents: ['PAN Card', 'Aadhaar / Address Proof', 'Bank Statement', 'Income Proof'],
    branches: ['Noida Sector 62'], fields: [], roles: DEFAULT_EXTRA_ROLES
  },
  permissions: {}, rules: [],
  settings: { capacity: 35, slaHours: 24, docSlaDays: 3 }
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULTS);

  const reload = useCallback(async () => {
    const token = localStorage.getItem('finlead_token');
    if (!token) return;
    try {
      const r = await api.get('/settings');
      setSettings(r.data);
    } catch { setSettings(DEFAULTS); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <SettingsContext.Provider value={{
      settings, reload,
      products:     settings?.custom?.products  || PRODUCT_TREE,
      stages:       settings?.custom?.statuses  || STAGES,
      sources:      settings?.custom?.sources   || SOURCES,
      docTemplates: settings?.custom?.documents || ['PAN Card', 'Aadhaar / Address Proof', 'Bank Statement', 'Income Proof'],
      branches:     settings?.custom?.branches  || [],
      customFields: settings?.custom?.fields    || [],
      customRoles:  settings?.custom?.roles     || DEFAULT_EXTRA_ROLES,
      rules:        settings?.rules             || []
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
