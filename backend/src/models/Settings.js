import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema({
  product: String,
  resource: String,
  rm: String,
  priority: { type: Number, default: 1 },
  active: { type: Boolean, default: true }
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  org: {
    name: { type: String, default: 'Aadi Fintech Financial Hub' },
    branch: { type: String, default: 'Noida Sector 62' },
    currency: { type: String, default: 'INR' },
    accent: { type: String, default: '#0f766e' }
  },
  rules: { type: [ruleSchema], default: [] },
  custom: {
    statuses: { type: [String], default: ['NEW', 'QUALIFIED', 'CONTACTED', 'FOLLOW_UP', 'IN_PROGRESS', 'DOCUMENT_COLLECTED', 'LOGIN_BANK', 'SANCTIONED', 'DISBURSED', 'REJECTED', 'CLOSED'] },
    products: {
      type: Map,
      of: [String],
      default: () => ({
        Investment: ['Mutual Fund (SIP / Lumpsum)', 'Fixed Deposit', 'Portfolio Management Service (PMS)', 'Bonds', 'Stock Advisory'],
        Loan: ['Home Loan', 'Personal Loan', 'Business Loan', 'Loan Against Property', 'Car Loan', 'Education Loan'],
        Insurance: ['Life Insurance (Term / ULIP / Endowment)', 'Health Insurance', 'Motor Insurance', 'Business Insurance']
      })
    },
    sources: { type: [String], default: ['Website Organic', 'Google Ads', 'Facebook / Instagram Ads', 'YouTube', 'WhatsApp Campaign', 'Referral', 'Walk-in', 'Telecalling', 'Partner / DSA', 'Connector', 'Other'] },
    documents: { type: [String], default: ['PAN Card', 'Aadhaar / Address Proof', 'Bank Statement', 'Income Proof'] },
    branches: { type: [String], default: ['Noida Sector 62', 'Delhi NCR', 'Ghaziabad', 'Gurugram'] },
    fields: { type: [String], default: ['Lead Quality', 'CIBIL Score', 'Preferred Bank', 'Expected Closure Date'] }
  },
  permissions: {
    type: Map,
    of: Map,
    default: () => ({
      MANAGER: { Dashboard: 1, Leads: 1, 'Lead Capture': 1, 'Team Members': 1, 'Assignment Channel': 1, Reports: 1, 'Access Control': 0, Personalisation: 0 },
      RM: { Dashboard: 1, Leads: 1, 'Lead Capture': 1, 'Team Members': 0, 'Assignment Channel': 0, Reports: 1, 'Access Control': 0, Personalisation: 0 },
      RESOURCE: { Dashboard: 1, Leads: 1, 'Lead Capture': 1, 'Team Members': 0, 'Assignment Channel': 0, Reports: 1, 'Access Control': 0, Personalisation: 0 },
      EMPLOYEE: { Dashboard: 1, Leads: 1, 'Lead Capture': 1, 'Team Members': 0, 'Assignment Channel': 0, Reports: 1, 'Access Control': 0, Personalisation: 0 }
    })
  },
  settings: {
    capacity: { type: Number, default: 35 },
    slaHours: { type: Number, default: 24 },
    docSlaDays: { type: Number, default: 3 }
  },
  activities: [{
    time: { type: String, default: () => new Date().toLocaleString('en-IN') },
    action: String,
    text: String,
    by: String
  }]
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
