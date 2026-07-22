import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile:   { type: String, required: true, trim: true },
  password: { type: String, required: true },
  // role is a free string — not enum — so admin can add custom roles (CA, BANKER, CONNECTOR)
  role:     { type: String, required: true, default: 'RESOURCE' },
  manager:  { type: String, default: null },
  rm:       { type: String, default: null },
  capacity: { type: Number, default: 0 },
  target:   { type: Number, default: 0 },
  city:     { type: String, default: '' },
  title:    { type: String, default: '' },
  active:   { type: Boolean, default: true },
  joined:   { type: String, default: () => new Date().toISOString().slice(0, 10) }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
