const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendEmail } = require('../utils/email');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, company, notificationEmail } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (notificationEmail && !emailRegex.test(notificationEmail)) {
      return res.status(400).json({ message: 'Invalid notification email format' });
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters with letters and numbers' });
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      company,
      notificationEmail,
    });

    await sendEmail({
      to: email,
      subject: 'Welcome to CNCGuard',
      text: `Hello ${name},\n\nYour account has been created successfully. Start monitoring your CNC machines now!\n\nBest,\nCNCGuard Team`,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login an existing user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Request a password reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Return success to prevent email enumeration
      return res.status(200).json({ message: 'If an account exists, a reset link has been sent' });
    }
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'CNCGuard Password Reset',
      text: `Hello ${user.name},\n\nYou requested a password reset. Click the link below to reset your password:\n${resetLink}\n\nThis link expires in 15 minutes. If you did not request this, please ignore this email.\n\nBest,\nCNCGuard Team`,
    });

    res.status(200).json({ message: 'If an account exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset link', error: error.message });
  }
});

// Reset password using token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must be at least 8 characters with letters and numbers' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findOne({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    await sendEmail({
      to: user.email,
      subject: 'CNCGuard Password Reset Successful',
      text: `Hello ${user.name},\n\nYour password has been successfully reset. If you did not perform this action, please contact support immediately.\n\nBest,\nCNCGuard Team`,
    });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
});

module.exports = router;