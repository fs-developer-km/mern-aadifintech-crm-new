import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { PRODUCT_TREE, STAGES, SOURCES } from '../utils/constants.js';

const SettingsContext = createContext(null);

const DEFAULTS = {
  org: { name: 'Aadi Fintech Financial Hub', branch: 'Noida Sector 62', accent: '#0f766e' },
  custom: {
    statuses: STAGES,
    products: PRODUCT_TREE,
    sources: SOURCES,
    documents: ['PAN Card', 'Aadhaar / Address Proof', 'Bank Statement', 'Income Proof'],
    branches: ['Noida Sector 62'],
    fields: []
  },
  permissions: {},
  rules: [],
  settings: { capacity: 35, slaHours: 24, docSlaDays: 3 }
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULTS);

  const reload = useCallback(async () => {
    // Only call if token exists
    const token = localStorage.getItem('finlead_token');
    if (!token) return;
    try {
      const r = await api.get('/settings');
      setSettings(r.data);
    } catch (e) {
      // 401 = not logged in, silently use defaults — DO NOT retry
      setSettings(DEFAULTS);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const products = settings?.custom?.products || PRODUCT_TREE;
  const stages = settings?.custom?.statuses || STAGES;
  const sources = settings?.custom?.sources || SOURCES;
  const docTemplates = settings?.custom?.documents || ['PAN Card', 'Aadhaar / Address Proof', 'Bank Statement', 'Income Proof'];
  const branches = settings?.custom?.branches || [];
  const customFields = settings?.custom?.fields || [];
  const rules = settings?.rules || [];

  return (
    <SettingsContext.Provider value={{ settings, reload, products, stages, sources, docTemplates, branches, customFields, rules }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
