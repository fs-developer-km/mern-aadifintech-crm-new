// ─── SYSTEM ROLES (cannot be deleted) ──────────────────────────────────────
export const SYSTEM_ROLES = ['ADMIN', 'MANAGER', 'RM', 'RESOURCE', 'EMPLOYEE'];

// ─── DEFAULT EXTRA ROLES (admin can add/remove more) ───────────────────────
export const DEFAULT_EXTRA_ROLES = [
  'CA',                  // Charted Accountant
  'BANKER',              // Banker
  'CONNECTOR',           // Connector
  'RC',                  // Referral Agent (RC)
  'INTERN',              // Intern
  'TELECALLER_AGENT',    // Telecaller Agent
  'TELECALLER_RM',       // Telecaller RM
  'TELECALLER_MANAGER',  // Telecaller Manager
];

// All roles combined
export const ROLES = [...SYSTEM_ROLES, ...DEFAULT_EXTRA_ROLES];

// Roles that can CAPTURE leads (appear in Resource dropdown on Capture page)
export const LEAD_CAPTURE_ROLES = [
  'RESOURCE',
  'CA',
  'BANKER',
  'CONNECTOR',
  'RC',
  'INTERN',
  'TELECALLER_AGENT',
  'EMPLOYEE',
];

// ─── ROLE DISPLAY NAMES (shown in dropdown) ─────────────────────────────────
export const ROLE_LABELS = {
  ADMIN:              'Admin',
  MANAGER:            'Manager',
  RM:                 'RM (Relationship Manager)',
  RESOURCE:           'Resource',
  EMPLOYEE:           'Employee',
  CA:                 'Charted Account (CA)',
  BANKER:             'Banker',
  CONNECTOR:          'Connector',
  RC:                 'Referral Agent (RC)',
  INTERN:             'Intern',
  TELECALLER_AGENT:   'Telecaller Agent',
  TELECALLER_RM:      'Telecaller RM',
  TELECALLER_MANAGER: 'Telecaller Manager',
};

// ─── ROLE HINTS (shown as subtitle in form) ─────────────────────────────────
export const ROLE_HINTS = {
  ADMIN:              'Full system access',
  MANAGER:            'Manages RMs and their leads',
  RM:                 'Manages Resources and reviews leads',
  RESOURCE:           'Captures and owns leads',
  EMPLOYEE:           'Back-office / support',
  CA:                 'Charted Account — captures & refers leads',
  BANKER:             'Bank partner — captures & refers leads',
  CONNECTOR:          'External connector — captures leads only',
  RC:                 'Referral Agent — refers leads from network',
  INTERN:             'Intern — captures leads under supervision',
  TELECALLER_AGENT:   'Telecaller — calls & captures leads',
  TELECALLER_RM:      'Telecaller RM — manages telecaller agents',
  TELECALLER_MANAGER: 'Telecaller Manager — manages telecaller RMs',
};

// ─── ROLE BADGE MAP (maps custom roles to existing CSS badge classes) ────────
export const ROLE_BADGE = {
  ADMIN:              'ADMIN',
  MANAGER:            'MANAGER',
  RM:                 'RM',
  RESOURCE:           'RESOURCE',
  EMPLOYEE:           'EMPLOYEE',
  CA:                 'MANAGER',
  BANKER:             'RM',
  CONNECTOR:          'RESOURCE',
  RC:                 'RESOURCE',
  INTERN:             'EMPLOYEE',
  TELECALLER_AGENT:   'EMPLOYEE',
  TELECALLER_RM:      'RM',
  TELECALLER_MANAGER: 'MANAGER',
};

// ─── SOURCE → RESOURCE ROLE MAPPING (dependent dropdown) ────────────────────
export const SOURCE_ROLE_MAP = {
  'Employee':          ['EMPLOYEE'],      // ✅ sirf Employee, RESOURCE hataya
  'Charted Account':   ['CHARTED ACCOUNT'],
  'Banker':            ['BANKER'],
  'Connector':         ['CONNECTOR'],
  'Founder':           ['ADMIN', 'MANAGER'],
  'Admin Team':        ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  'Telecalling':       ['TELECALLER_AGENT'],   // ye bhi strictly rakh diya, agar RESOURCE/EMPLOYEE chahiye to bata dena
  'Partner / DSA':     ['CONNECTOR', 'RC'],
  'Website Organic':          null,
  'Google Ads':               null,
  'Facebook / Instagram Ads': null,
  'YouTube':                  null,
  'WhatsApp Campaign':        null,
  'Referral':                 ['RC', 'CONNECTOR', 'RESOURCE'],  // ye bhi batao agar strict karna hai
  'Walk-in':                  null,
  'Other':                    null,
};

// ─── PIPELINE STAGES ────────────────────────────────────────────────────────
export const STAGES = [
  'NEW', 'QUALIFIED', 'CONTACTED', 'FOLLOW_UP', 'IN_PROGRESS',
  'DOCUMENT_COLLECTED', 'LOGIN_BANK', 'SANCTIONED', 'DISBURSED', 'REJECTED', 'CLOSED'
];

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export const PRODUCT_TREE = {
  Investment: [
    'Mutual Fund (SIP / Lumpsum)',
    'Fixed Deposit',
    'Portfolio Management Service (PMS)',
    'Bonds',
    'Stock Advisory',
  ],
  Loan: [
    'Home Loan',
    'Personal Loan',
    'Business Loan',
    'MSME Loan',
    'Loan Against Property',
    'Car Loan',
    'Education Loan',
    'Gold Loan',
  ],
  Insurance: [
    'Life Insurance (Term / ULIP / Endowment)',
    'Health Insurance',
    'Motor Insurance',
    'Business Insurance',
  ],
};

// ─── SOURCES ─────────────────────────────────────────────────────────────────
export const SOURCES = [
  // Internal
  'Employee',
  'Charted Account',
  'Banker',
  'Connector',
  'Founder',
  'Admin Team',
  // Digital
  'Website Organic',
  'Google Ads',
  'Facebook / Instagram Ads',
  'YouTube',
  'WhatsApp Campaign',
  // Field
  'Referral',
  'Walk-in',
  'Telecalling',
  'Partner / DSA',
  'Other',
];

// ─── NAV ─────────────────────────────────────────────────────────────────────
export const NAV = [
  'Dashboard', 'Leads', 'Lead Capture', 'Team Members',
  'Assignment Channel', 'Reports', 'Access Control', 'Personalisation'
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export const CONVERTED = ['SANCTIONED', 'DISBURSED', 'CLOSED', 'APPROVED'];

export const money = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));