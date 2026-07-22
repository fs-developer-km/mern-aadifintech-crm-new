import User from '../models/User.js';

// Get all users (role-filtered)
export const getUsers = async (req, res) => {
  try {
    let query = {};
    const { role } = req.user;

    if (role === 'MANAGER') {
      query = { $or: [{ manager: req.user.name }, { _id: req.user._id }] };
    } else if (role === 'RM') {
      query = { $or: [{ rm: req.user.name }, { _id: req.user._id }] };
    } else if (!['ADMIN'].includes(role)) {
      query = { _id: req.user._id };
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create user
export const createUser = async (req, res) => {
  try {
    const { name, email, mobile, role, manager, rm, capacity, city, title, target, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const user = await User.create({
      name, email, mobile, role, manager: manager || null, rm: rm || null,
      capacity: Number(capacity || 0), city, title: title || 'Team Member',
      target: Number(target || 0), password: password || '1234'
    });
    res.status(201).json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user
// export const updateUser = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const allowed = ['name', 'mobile', 'role', 'manager', 'rm', 'capacity', 'city', 'title', 'target', 'active'];
//     const updates = {};
//     allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

//     const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
//     if (!user) return res.status(404).json({ error: 'User not found' });
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    // Manager sirf apni team (jinka manager field uska naam hai) edit kar sakta hai
    if (req.user.role === 'MANAGER' && target.manager !== req.user.name) {
      return res.status(403).json({ error: 'Forbidden: not in your team' });
    }

    const allowed = ['name', 'mobile', 'role', 'manager', 'rm', 'capacity', 'city', 'title', 'target', 'active'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = password || '1234';
    await user.save();
    res.json({ message: 'Password reset' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get RMs / resources / managers for dropdowns
// export const getByRole = async (req, res) => {
//   try {
//     const { role } = req.params;
//     const users = await User.find({ role: role.toUpperCase(), active: true }).select('name email mobile city manager rm _id');
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


export const getByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const targetRole = role.toUpperCase();
    const { role: reqRole, name: reqName } = req.user;

    let query = { role: targetRole, active: true };

    if (reqRole === 'ADMIN') {
      // Admin ko sab dikhega, koi extra restriction nahi
    } else if (reqRole === 'MANAGER') {
      if (targetRole === 'RM') {
        query.manager = reqName; // sirf apni team ke RMs
      } else if (targetRole === 'RESOURCE') {
        const myRms = await User.find({ role: 'RM', manager: reqName }).select('name').lean();
        query.rm = { $in: myRms.map(r => r.name) }; // sirf apni RMs ke resources
      } else {
        return res.json([]); // manager ko doosre managers/admin list nahi chahiye
      }
    } else if (reqRole === 'RM') {
      if (targetRole === 'RESOURCE') {
        query.rm = reqName; // sirf apne resources
      } else {
        return res.json([]); // RM ko RM/Manager list ki zarurat nahi
      }
    } else {
      return res.json([]); // RESOURCE ya koi aur role — dropdown access nahi
    }

    const users = await User.find(query).select('name email mobile city manager rm _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
