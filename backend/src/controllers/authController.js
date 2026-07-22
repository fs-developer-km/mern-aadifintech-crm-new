import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: 'Email/mobile and password required' });

    const id = identifier.toLowerCase().trim();
    const user = await User.findOne({
      active: true,
      $or: [{ email: id }, { mobile: identifier.trim() }]
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'finlead_secret', { expiresIn: '7d' });

    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(400).json({ error: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// this is function for change login in admin panel

export const impersonate = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const target = await User.findById(req.params.userId);
    if (!target || !target.active) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Naya token target user ke liye — audit ke liye impersonatedBy bhi save karte hain
    const token = jwt.sign(
      { id: target._id, impersonatedBy: req.user._id },
      process.env.JWT_SECRET || 'finlead_secret',
      { expiresIn: '2h' }
    );

    res.json({ token, user: target.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
