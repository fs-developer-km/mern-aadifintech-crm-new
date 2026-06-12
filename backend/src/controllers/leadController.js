import Lead from '../models/Lead.js';
import Settings from '../models/Settings.js';

const CONVERTED = ['SANCTIONED', 'DISBURSED', 'CLOSED', 'APPROVED'];

const visibilityFilter = (user) => {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'MANAGER') return { manager: user.name };
  if (user.role === 'RM') return { rm: user.name };
  if (user.role === 'RESOURCE') return { resource: user.name };
  return {};
};

export const getLeads = async (req, res) => {
  try {
    const { q, status, rm, source, main, from, to, score, page = 1, limit = 50 } = req.query;
    let filter = visibilityFilter(req.user);

    if (status) filter.status = status;
    if (rm) filter.rm = rm;
    if (source) filter.source = source;
    if (main) filter.main = main;
    if (score) filter.score = { $gte: Number(score) };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59');
    }
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { pan: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Lead.countDocuments(filter)
    ]);
    res.json({ leads, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createLead = async (req, res) => {
  try {
    const settings = await Settings.findOne().lean();
    const docTemplates = settings?.custom?.documents?.length
      ? settings.custom.documents
      : ['PAN Card', 'Aadhaar / Address Proof', 'Bank Statement', 'Income Proof'];
    const statuses = settings?.custom?.statuses?.length
      ? settings.custom.statuses
      : ['NEW'];

    const { name, mobile, email, city, state, main, sub, source, amount, resource, rm, manager, custom, message } = req.body;
    const now = new Date().toLocaleString('en-IN');
    const docs = docTemplates.map(type => ({ type, status: 'PENDING', file: '' }));

    const lead = await Lead.create({
      name, mobile, email: email || '', city: city || '', state: state || '',
      main: main || '', sub: sub || '', source: source || '',
      amount: Number(amount || 0),
      status: statuses[0] || 'NEW',
      resource: resource || '', rm: rm || '', manager: manager || '',
      score: 65,
      docs,
      notes: message ? [message] : [],
      timeline: [
        { time: now, action: 'Lead Created', text: `Captured by ${resource || req.user.name}`, by: req.user.name },
        { time: now, action: 'Assigned', text: `${resource} → ${rm} → ${manager}`, by: 'System' }
      ],
      custom: custom || {}
    });

    // Activity log
    await Settings.findOneAndUpdate({}, {
      $push: {
        activities: {
          $each: [{ time: now, action: 'Lead Created', text: `${name} entered through ${source}`, by: req.user.name }],
          $position: 0
        }
      }
    }, { upsert: true });

    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const allowed = ['name', 'mobile', 'email', 'city', 'state', 'pan', 'amount', 'status', 'resource', 'rm', 'manager', 'score', 'nextFollowUp'];
    const now = new Date().toLocaleString('en-IN');

    allowed.forEach(k => {
      if (req.body[k] !== undefined && String(req.body[k]) !== String(lead[k] || '')) {
        lead.timeline.unshift({ time: now, action: 'Updated', text: `${k} changed to ${req.body[k]}`, by: req.user.name });
        lead[k] = req.body[k];
      }
    });

    if (req.body.custom && typeof req.body.custom === 'object') {
      for (const [k, v] of Object.entries(req.body.custom)) {
        lead.custom.set(k, v);
        lead.timeline.unshift({ time: now, action: 'Custom Field', text: `${k} → ${v}`, by: req.user.name });
      }
    }

    await lead.save();
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Note text required' });
    const now = new Date().toLocaleString('en-IN');
    const lead = await Lead.findByIdAndUpdate(req.params.id, {
      $push: {
        notes: { $each: [text], $position: 0 },
        timeline: { $each: [{ time: now, action: 'Note Added', text, by: req.user.name }], $position: 0 }
      }
    }, { new: true });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDocStatus = async (req, res) => {
  try {
    const { id, index } = req.params;
    const { status } = req.body;
    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    lead.docs[Number(index)].status = status;
    const now = new Date().toLocaleString('en-IN');
    lead.timeline.unshift({ time: now, action: 'Document Review', text: `${lead.docs[Number(index)].type} marked ${status}`, by: req.user.name });

    if (lead.docs.every(d => d.status === 'APPROVED')) {
      lead.status = 'DOCUMENT_COLLECTED';
    }
    await lead.save();
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteLead = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const filter = visibilityFilter(req.user);
    const leads = await Lead.find(filter).lean();

    const total = leads.length;
    const converted = leads.filter(l => CONVERTED.includes(l.status)).length;
    const pendingDocs = leads.reduce((a, l) =>
      a + (l.docs || []).filter(d => d.status !== 'APPROVED').length, 0);

    const funnel = {}, sourceMix = {}, productMix = {}, rmPerf = {};
    leads.forEach(l => {
      funnel[l.status] = (funnel[l.status] || 0) + 1;
      if (l.source) sourceMix[l.source] = (sourceMix[l.source] || 0) + 1;
      if (l.main) productMix[l.main] = (productMix[l.main] || 0) + 1;
      if (l.rm) {
        if (!rmPerf[l.rm]) rmPerf[l.rm] = { leads: 0, converted: 0 };
        rmPerf[l.rm].leads++;
        if (CONVERTED.includes(l.status)) rmPerf[l.rm].converted++;
      }
    });

    res.json({
      total, converted,
      conversionRate: total ? Math.round(converted / total * 100) : 0,
      pendingDocs, funnel, sourceMix, productMix, rmPerf
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
