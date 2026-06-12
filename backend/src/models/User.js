import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'MANAGER', 'RM', 'RESOURCE', 'EMPLOYEE'], required: true },
  manager: { type: String, default: null },   // manager name
  rm: { type: String, default: null },         // rm name (for RESOURCE)
  capacity: { type: Number, default: 0 },
  target: { type: Number, default: 0 },
  city: { type: String, default: '' },
  title: { type: String, default: '' },
  active: { type: Boolean, default: true },
  joined: { type: String, default: () => new Date().toISOString().slice(0, 10) }
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
