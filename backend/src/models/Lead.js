import mongoose from 'mongoose';

const docSchema = new mongoose.Schema({
  type: String,
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  file: { type: String, default: '' }
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  time: { type: String, default: () => new Date().toLocaleString('en-IN') },
  action: String,
  text: String,
  by: String
}, { _id: false });

const callSchema = new mongoose.Schema({
  time: { type: String, default: () => new Date().toLocaleString('en-IN') },
  outcome: String,
  by: String,
  note: String
}, { _id: false });

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  email: { type: String, default: '', lowercase: true, trim: true },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pan: { type: String, default: '' },
  main: { type: String, default: '' },       // main product category
  sub: { type: String, default: '' },        // sub product
  source: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  status: { type: String, default: 'NEW' },
  score: { type: Number, default: 65 },

  // Assignment chain
  resource: { type: String, default: '' },
  rm: { type: String, default: '' },
  manager: { type: String, default: '' },

  notes: [String],
  docs: [docSchema],
  calls: [callSchema],
  timeline: [timelineSchema],
  nextFollowUp: { type: String, default: '' },

  // Custom fields (key-value)
  custom: { type: Map, of: String, default: {} }
}, { timestamps: true });

leadSchema.index({ name: 'text', mobile: 'text', email: 'text', city: 'text' });
leadSchema.index({ status: 1 });
leadSchema.index({ rm: 1 });
leadSchema.index({ resource: 1 });
leadSchema.index({ manager: 1 });

export default mongoose.model('Lead', leadSchema);
