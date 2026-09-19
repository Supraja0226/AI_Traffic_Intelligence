const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        organization: user.organization
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, role = 'analyst', name, organization } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      name: name || username,
      organization: organization || 'Department of Transportation'
    });

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
      organization: user.organization
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Demo quick-login switch allowing instant evaluation of roles (admin, analyst, operator, viewer)
exports.quickSwitchRole = async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['admin', 'analyst', 'operator', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    let user = await User.findOne({ role });
    if (!user) {
      const hashedPassword = await bcrypt.hash('Demo@123', 10);
      user = await User.create({
        username: `${role}_demo`,
        email: `${role}@traffic.ai`,
        password: hashedPassword,
        role,
        name: `Demo ${role.toUpperCase()}`
      });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
