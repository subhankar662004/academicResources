import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'academic-hub-secret-key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user
    const user = new User({ name, email, password });
    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('=== LOGIN DEBUG ===');
    console.log('Login attempt - Email:', email);
    console.log('Login attempt - Password received:', password ? 'yes' : 'no');
    console.log('Password value:', JSON.stringify(password));

    // Find user with exact email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log('User found:', user ? 'yes' : 'no');
    console.log('User email in DB:', user?.email);
    
    if (!user) {
      console.log('=== USER NOT FOUND ===');
      console.log('Looking for email:', email.toLowerCase().trim());
      // Let's check what users exist
      const allUsers = await User.find({});
      console.log('All users in DB:', allUsers.map(u => u.email));
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User role in DB:', user.role);
    console.log('Password in DB (first 20 chars):', user.password.substring(0, 20));
    
    // Direct bcrypt compare with explicit logging
    const bcrypt = await import('bcryptjs');
    const isMatch = await bcrypt.default.compare(password, user.password);
    console.log('Password comparison result:', isMatch);
    
    if (!isMatch) {
      console.log('=== PASSWORD MISMATCH ===');
      console.log('Input password:', password);
      console.log('Stored hash:', user.password);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('=== LOGIN SUCCESS ===');
    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
