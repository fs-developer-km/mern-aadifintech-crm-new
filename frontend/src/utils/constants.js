export const ROLES = ['ADMIN', 'MANAGER', 'RM', 'RESOURCE', 'EMPLOYEE'];

export const STAGES = [
  'NEW', 'QUALIFIED', 'CONTACTED', 'FOLLOW_UP', 'IN_PROGRESS',
  'DOCUMENT_COLLECTED', 'LOGIN_BANK', 'SANCTIONED', 'DISBURSED', 'REJECTED', 'CLOSED'
];

export const PRODUCT_TREE = {
  Investment: ['Mutual Fund (SIP / Lumpsum)', 'Fixed Deposit', 'Portfolio Management Service (PMS)', 'Bonds', 'Stock Advisory'],
  Loan: ['Home Loan', 'Personal Loan', 'Business Loan', 'Loan Against Property', 'Car Loan', 'Education Loan'],
  Insurance: ['Life Insurance (Term / ULIP / Endowment)', 'Health Insurance', 'Motor Insurance', 'Business Insurance']
};

export const SOURCES = [
  'Website Organic', 'Google Ads', 'Facebook / Instagram Ads', 'YouTube',
  'WhatsApp Campaign', 'Referral', 'Walk-in', 'Telecalling', 'Partner / DSA', 'Connector', 'Other'
];

export const NAV = [
  'Dashboard', 'Leads', 'Lead Capture', 'Team Members',
  'Assignment Channel', 'Reports', 'Access Control', 'Personalisation'
];

export const CONVERTED = ['SANCTIONED', 'DISBURSED', 'CLOSED', 'APPROVED'];

export const money = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));
