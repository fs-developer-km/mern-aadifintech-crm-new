import Lead from '../models/Lead.js';
import User from '../models/User.js';

const CONVERTED = ['SANCTIONED', 'DISBURSED', 'CLOSED', 'APPROVED'];

const buildFilter = (user, query) => {
  let filter = {};

  const { employee, manager, rm, branch, product, source, status, from, to, score, search } = query;

  // Ye sab query filters sirf ADMIN ke liye poori tarah free honge.
  // Non-admin ke liye bhi allow karenge, but role-restriction end me force hoga.
  if (manager) filter.manager = manager;
  if (rm) filter.rm = rm;
  if (employee) filter.$or = [{ resource: employee }, { rm: employee }, { manager: employee }];
  if (branch) filter.city = branch;
  if (product) filter.main = product;
  if (source) filter.source = source;
  if (status) filter.status = status;
  if (score) filter.score = { $gte: Number(score) };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59');
  }
  if (search) {
    const s = { $regex: search, $options: 'i' };
    filter.$or = [
      { name: s }, { mobile: s }, { email: s },
      { resource: s }, { rm: s }, { manager: s }, { city: s }
    ];
  }

  // Role-based scope hamesha final aur non-negotiable hoga
  if (user.role === 'MANAGER') filter.manager = user.name;
  else if (user.role === 'RM') filter.rm = user.name;
  else if (user.role === 'RESOURCE') filter.resource = user.name;
  // ADMIN ke liye koi restriction nahi

  return filter;
};


// const buildFilter = (user, query) => {
//   let filter = {};
//   // Role-based visibility
//   if (user.role === 'MANAGER') filter.manager = user.name;
//   else if (user.role === 'RM') filter.rm = user.name;
//   else if (user.role === 'RESOURCE') filter.resource = user.name;

//   const { employee, manager, rm, branch, product, source, status, from, to, score, search } = query;
//   if (employee) filter.$or = [{ resource: employee }, { rm: employee }, { manager: employee }];
//   if (manager) filter.manager = manager;
//   if (rm) filter.rm = rm;
//   if (branch) filter.city = branch;
//   if (product) filter.main = product;
//   if (source) filter.source = source;
//   if (status) filter.status = status;
//   if (score) filter.score = { $gte: Number(score) };
//   if (from || to) {
//     filter.createdAt = {};
//     if (from) filter.createdAt.$gte = new Date(from);
//     if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59');
//   }
//   if (search) {
//     const s = { $regex: search, $options: 'i' };
//     filter.$or = [
//       { name: s }, { mobile: s }, { email: s },
//       { resource: s }, { rm: s }, { manager: s }, { city: s }
//     ];
//   }
//   return filter;
// };

export const getMisReport = async (req, res) => {
  try {
    const filter = buildFilter(req.user, req.query);
    const { role: qRole, employee: qEmp } = req.query;

    const [leads, users] = await Promise.all([
      Lead.find(filter).lean(),
      User.find().select('-password').lean()
    ]);

    const total = leads.length;
    const converted = leads.filter(l => CONVERTED.includes(l.status)).length;
    const totalAmount = leads.reduce((a, l) => a + Number(l.amount || 0), 0);

    // Employee-wise MIS rows
    const filteredUsers = users.filter(u =>
      (!qRole || u.role === qRole) &&
      (!qEmp || u.name === qEmp)
    );

    const employeeMis = filteredUsers.map(u => {
      const rows = leads.filter(l =>
        l.resource === u.name || l.rm === u.name || l.manager === u.name
      );
      const conv = rows.filter(l => CONVERTED.includes(l.status)).length;
      const pending = rows.reduce((a, l) =>
        a + (l.docs || []).filter(d => d.status !== 'APPROVED').length, 0);
      const amount = rows.reduce((a, l) => a + Number(l.amount || 0), 0);
      return {
        employee: u.name,
        role: u.role,
        manager: u.manager || '-',
        leads: rows.length,
        converted: conv,
        pending,
        amount,
        conversion: rows.length ? Math.round(conv / rows.length * 100) : 0
      };
    }).filter(r => r.leads > 0);

    // Charts
    const funnel = {}, sourceMix = {}, productMix = {};
    leads.forEach(l => {
      funnel[l.status] = (funnel[l.status] || 0) + 1;
      if (l.source) sourceMix[l.source] = (sourceMix[l.source] || 0) + 1;
      if (l.main) productMix[l.main] = (productMix[l.main] || 0) + 1;
    });

    // RM perf
    const rmPerf = {};
    leads.forEach(l => {
      if (!l.rm) return;
      if (!rmPerf[l.rm]) rmPerf[l.rm] = { leads: 0, converted: 0, pending: 0 };
      rmPerf[l.rm].leads++;
      if (CONVERTED.includes(l.status)) rmPerf[l.rm].converted++;
      rmPerf[l.rm].pending += (l.docs || []).filter(d => d.status !== 'APPROVED').length;
    });

    // Resource perf
    const resourcePerf = {};
    leads.forEach(l => {
      if (!l.resource) return;
      if (!resourcePerf[l.resource]) resourcePerf[l.resource] = { leads: 0, converted: 0, pending: 0 };
      resourcePerf[l.resource].leads++;
      if (CONVERTED.includes(l.status)) resourcePerf[l.resource].converted++;
      resourcePerf[l.resource].pending += (l.docs || []).filter(d => d.status !== 'APPROVED').length;
    });

    res.json({ total, converted, totalAmount, employeeMis, funnel, sourceMix, productMix, rmPerf, resourcePerf });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const exportLeadsCsv = async (req, res) => {
  try {
    const filter = buildFilter(req.user, req.query);
    const leads = await Lead.find(filter).lean();

    const header = 'Name,Mobile,Email,Product,Sub Product,Source,Resource,RM,Manager,Status,Amount,Score,City,State,Created';
    const rows = leads.map(l =>
      `"${l.name}","${l.mobile}","${l.email}","${l.main}","${l.sub}","${l.source}","${l.resource}","${l.rm}","${l.manager}","${l.status}","${l.amount}","${l.score}","${l.city}","${l.state}","${new Date(l.createdAt).toLocaleDateString('en-IN')}"`
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
    res.send([header, ...rows].join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
