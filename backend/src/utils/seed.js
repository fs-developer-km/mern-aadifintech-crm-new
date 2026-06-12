import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Settings from '../models/Settings.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/finlead_crm';

const seedUsers = [
  { name: 'System Admin',  email: 'admin@aadi.local',              mobile: '9900000001', role: 'ADMIN',    city: 'Noida Sector 62', title: 'Owner',              password: 'admin123',    target: 0  },
  { name: 'Meera Iyer',   email: 'meera.manager@aadi.local',      mobile: '9900000002', role: 'MANAGER',  city: 'Noida Sector 62', title: 'West Zone Manager',  password: 'manager123',  target: 0  },
  { name: 'Riya Mehta',   email: 'riya.rm@aadi.local',            mobile: '9900000003', role: 'RM',       city: 'Noida Sector 62', title: 'Investment RM',      password: 'rm123',       target: 25, manager: 'Meera Iyer', capacity: 35 },
  { name: 'Arjun Shah',   email: 'arjun.rm@aadi.local',           mobile: '9900000004', role: 'RM',       city: 'Pune',            title: 'Loan RM',            password: 'rm123',       target: 25, manager: 'Meera Iyer', capacity: 30 },
  { name: 'Kabir Khan',   email: 'kabir.resource@aadi.local',     mobile: '9900000005', role: 'RESOURCE', city: 'Nashik',          title: 'Field Resource',     password: 'resource123', target: 45, manager: 'Meera Iyer', rm: 'Riya Mehta',  capacity: 60 },
  { name: 'Sana Rao',     email: 'sana.resource@aadi.local',      mobile: '9900000006', role: 'RESOURCE', city: 'Thane',           title: 'Telecalling Resource',password: 'resource123', target: 45, manager: 'Meera Iyer', rm: 'Arjun Shah',  capacity: 60 },
  { name: 'Lead Desk',    email: 'desk@aadi.local',               mobile: '9900000007', role: 'EMPLOYEE', city: 'Noida Sector 62', title: 'Back Office',        password: 'employee123', target: 0  }
];

async function seed() {
  console.log('Connecting to:', MONGO_URI.replace(/:([^@]+)@/, ':****@'));
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  await User.deleteMany({});
  await Lead.deleteMany({});
  await Settings.deleteMany({});
  console.log('🗑️  Cleared old data');

  // Create users one-by-one (triggers bcrypt pre-save hook)
  for (const u of seedUsers) {
    await User.create(u);
    console.log(`  👤 Created: ${u.name} (${u.role}) — password: ${u.password}`);
  }

  // Demo leads
  const now = new Date().toLocaleString('en-IN');
  await Lead.insertMany([
    { name: 'Aadi Sharma',  mobile: '9876543210', email: 'aadi@test.com',  city: 'Mumbai', state: 'Maharashtra', main: 'Investment', sub: 'Mutual Fund (SIP / Lumpsum)', source: 'Website Organic', amount: 250000, status: 'QUALIFIED',   resource: 'Kabir Khan', rm: 'Riya Mehta', manager: 'Meera Iyer', score: 78, docs: [{type:'PAN Card',status:'APPROVED'},{type:'Aadhaar / Address Proof',status:'PENDING'},{type:'Bank Statement',status:'PENDING'},{type:'Income Proof',status:'PENDING'}], notes: ['Initial enquiry'], timeline: [{time:now,action:'Lead Created',text:'Captured by Kabir Khan',by:'System'}] },
    { name: 'Priya Nair',   mobile: '9822221111', email: 'priya@test.com', city: 'Pune',   state: 'Maharashtra', main: 'Loan',       sub: 'Home Loan',                   source: 'Google Ads',     amount: 6500000,status: 'LOGIN_BANK',  resource: 'Sana Rao',   rm: 'Arjun Shah', manager: 'Meera Iyer', score: 84, docs: [{type:'PAN Card',status:'APPROVED'},{type:'Aadhaar / Address Proof',status:'APPROVED'},{type:'Bank Statement',status:'APPROVED'},{type:'Income Proof',status:'PENDING'}], notes: [], timeline: [{time:now,action:'Lead Created',text:'Captured by Sana Rao',by:'System'}] },
    { name: 'Karan Patel',  mobile: '9711112222', email: 'karan@test.com', city: 'Ahmedabad', state: 'Gujarat', main: 'Insurance',  sub: 'Health Insurance',            source: 'Referral',       amount: 500000, status: 'NEW',        resource: 'Kabir Khan', rm: 'Riya Mehta', manager: 'Meera Iyer', score: 61, docs: [{type:'PAN Card',status:'PENDING'},{type:'Aadhaar / Address Proof',status:'PENDING'},{type:'Bank Statement',status:'PENDING'},{type:'Income Proof',status:'PENDING'}], notes: [], timeline: [{time:now,action:'Lead Created',text:'Captured by Kabir Khan',by:'System'}] },
    { name: 'Nidhi Jain',   mobile: '9811118888', email: 'nidhi@test.com', city: 'Surat',  state: 'Gujarat',     main: 'Loan',       sub: 'Business Loan',               source: 'Partner / DSA',  amount: 2500000,status: 'FOLLOW_UP',  resource: 'Sana Rao',   rm: 'Arjun Shah', manager: 'Meera Iyer', score: 72, docs: [{type:'PAN Card',status:'PENDING'},{type:'Aadhaar / Address Proof',status:'PENDING'},{type:'Bank Statement',status:'PENDING'},{type:'Income Proof',status:'PENDING'}], notes: [], timeline: [{time:now,action:'Lead Created',text:'Captured by Sana Rao',by:'System'}] },
  ]);
  console.log('📋 Leads seeded: 4');

  await Settings.create({
    org: { name: 'Aadi Fintech Financial Hub', branch: 'Noida Sector 62', currency: 'INR', accent: '#0f766e' },
    rules: [
      { product: 'Mutual Fund (SIP / Lumpsum)', resource: 'Kabir Khan', rm: 'Riya Mehta', priority: 1, active: true },
      { product: 'Home Loan',                   resource: 'Sana Rao',   rm: 'Arjun Shah', priority: 1, active: true },
      { product: 'Business Loan',               resource: 'Sana Rao',   rm: 'Arjun Shah', priority: 2, active: true },
      { product: 'Health Insurance',            resource: 'Kabir Khan', rm: 'Riya Mehta', priority: 1, active: true },
    ],
    activities: [
      { time: now, action: 'Lead Created', text: 'Aadi Sharma entered through Website Organic', by: 'System' },
      { time: now, action: 'Lead Created', text: 'Priya Nair entered through Google Ads', by: 'System' },
    ]
  });
  console.log('⚙️  Settings seeded');

  console.log('\n✅ SEED COMPLETE!\n');
  console.log('Demo Login Credentials:');
  console.log('─────────────────────────────────────────────────────');
  seedUsers.forEach(u => console.log(`  ${u.role.padEnd(10)} ${u.email.padEnd(38)} ${u.password}`));
  console.log('─────────────────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
