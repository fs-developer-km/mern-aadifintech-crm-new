import Settings from '../models/Settings.js';

const DEFAULT_SETTINGS = {
  org: { name: 'Aadi Fintech Financial Hub', branch: 'Noida Sector 62', currency: 'INR', accent: '#0f766e' },
  custom: {
    statuses: ['NEW','QUALIFIED','CONTACTED','FOLLOW_UP','IN_PROGRESS','DOCUMENT_COLLECTED','LOGIN_BANK','SANCTIONED','DISBURSED','REJECTED','CLOSED'],
    products: {
      Investment: ['Mutual Fund (SIP / Lumpsum)', 'Fixed Deposit', 'Portfolio Management Service (PMS)', 'Bonds', 'Stock Advisory'],
      Loan: ['Home Loan', 'Personal Loan', 'Business Loan', 'Loan Against Property', 'Car Loan', 'Education Loan'],
      Insurance: ['Life Insurance (Term / ULIP / Endowment)', 'Health Insurance', 'Motor Insurance', 'Business Insurance']
    },
    sources: ['Website Organic','Google Ads','Facebook / Instagram Ads','YouTube','WhatsApp Campaign','Referral','Walk-in','Telecalling','Partner / DSA','Connector','Other'],
    documents: ['PAN Card','Aadhaar / Address Proof','Bank Statement','Income Proof'],
    branches: ['Noida Sector 62'],
    fields: []
  },
  permissions: {
    MANAGER:  { Dashboard:1, Leads:1, 'Lead Capture':1, 'Team Members':1, 'Assignment Channel':1, Reports:1, 'Access Control':0, Personalisation:0 },
    RM:       { Dashboard:1, Leads:1, 'Lead Capture':1, 'Team Members':0, 'Assignment Channel':0, Reports:1, 'Access Control':0, Personalisation:0 },
    RESOURCE: { Dashboard:1, Leads:1, 'Lead Capture':1, 'Team Members':0, 'Assignment Channel':0, Reports:1, 'Access Control':0, Personalisation:0 },
    EMPLOYEE: { Dashboard:1, Leads:1, 'Lead Capture':1, 'Team Members':0, 'Assignment Channel':0, Reports:1, 'Access Control':0, Personalisation:0 }
  },
  rules: [],
  settings: { capacity: 35, slaHours: 24, docSlaDays: 3 },
  activities: []
};

const getOrCreate = async () => {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});
  return s;
};

const toPlain = (s) => {
  const plain = s.toObject ? s.toObject() : s;
  // Convert Map -> plain object for products
  if (plain.custom?.products instanceof Map) {
    plain.custom.products = Object.fromEntries(plain.custom.products);
  } else if (plain.custom?.products && typeof plain.custom.products === 'object' && !Array.isArray(plain.custom.products)) {
    // already plain
  }
  // Convert Map -> plain object for permissions
  if (plain.permissions instanceof Map) {
    const permsObj = {};
    for (const [role, permsMap] of plain.permissions) {
      permsObj[role] = permsMap instanceof Map ? Object.fromEntries(permsMap) : permsMap;
    }
    plain.permissions = permsObj;
  }
  return plain;
};

export const getSettings = async (req, res) => {
  try {
    const s = await getOrCreate();
    res.json(toPlain(s));
  } catch (err) {
    // Return safe defaults if DB fails
    res.json(DEFAULT_SETTINGS);
  }
};

export const updateOrg = async (req, res) => {
  try {
    const s = await getOrCreate();
    const allowed = ['name', 'branch', 'currency', 'accent'];
    allowed.forEach(k => { if (req.body[k] !== undefined) s.org[k] = req.body[k]; });
    await s.save();
    res.json({ message: 'Org updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const updateSystemSettings = async (req, res) => {
  try {
    const s = await getOrCreate();
    const { capacity, slaHours, docSlaDays } = req.body;
    if (capacity !== undefined) s.settings.capacity = Number(capacity);
    if (slaHours !== undefined) s.settings.slaHours = Number(slaHours);
    if (docSlaDays !== undefined) s.settings.docSlaDays = Number(docSlaDays);
    await s.save();
    res.json({ message: 'System settings updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getRules = async (req, res) => {
  try {
    const s = await getOrCreate();
    res.json(s.rules || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const saveRule = async (req, res) => {
  try {
    const s = await getOrCreate();
    const { product, resource, rm, priority } = req.body;
    const idx = s.rules.findIndex(r => r.product === product);
    if (idx >= 0) {
      s.rules[idx] = { product, resource, rm, priority: priority || 1, active: true };
    } else {
      s.rules.push({ product, resource, rm, priority: priority || 1, active: true });
    }
    await s.save();
    res.json(s.rules);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const toggleRule = async (req, res) => {
  try {
    const s = await getOrCreate();
    const rule = s.rules[Number(req.params.index)];
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    rule.active = !rule.active;
    await s.save();
    res.json(s.rules);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const deleteRule = async (req, res) => {
  try {
    const s = await getOrCreate();
    s.rules.splice(Number(req.params.index), 1);
    await s.save();
    res.json(s.rules);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const updatePermissions = async (req, res) => {
  try {
    const s = await getOrCreate();
    const { role, screen, value } = req.body;
    if (!s.permissions) s.permissions = new Map();
    if (!s.permissions.get(role)) s.permissions.set(role, new Map());
    s.permissions.get(role).set(screen, value ? 1 : 0);
    s.markModified('permissions');
    await s.save();
    res.json({ message: 'Permission updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const addToList = async (req, res) => {
  try {
    const { listName } = req.params;
    const { value } = req.body;
    const allowed = ['statuses', 'sources', 'documents', 'branches', 'fields'];
    if (!allowed.includes(listName)) return res.status(400).json({ error: 'Invalid list' });
    const s = await getOrCreate();
    if (!s.custom[listName].includes(value)) s.custom[listName].push(value);
    await s.save();
    res.json(s.custom[listName]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const addProduct = async (req, res) => {
  try {
    const { category, subProduct } = req.body;
    const s = await getOrCreate();
    const existing = s.custom.products.get(category) || [];
    if (!existing.includes(subProduct)) existing.push(subProduct);
    s.custom.products.set(category, existing);
    s.markModified('custom.products');
    await s.save();
    res.json(Object.fromEntries(s.custom.products));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getActivities = async (req, res) => {
  try {
    const s = await Settings.findOne().lean();
    res.json((s?.activities || []).slice(0, 20));
  } catch (err) { res.status(500).json({ error: err.message }); }
};
