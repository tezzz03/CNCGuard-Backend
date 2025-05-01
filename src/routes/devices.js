const express = require('express');
const jwt = require('jsonwebtoken');
const { Device, User } = require('../models');
const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const devices = await Device.findAll({ where: { userId: req.user.userId } });
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Failed to fetch devices', error: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, spindleSpeed, vibrationLevel, toolWear, temperature, energyConsumption } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const device = await Device.create({
      name,
      userId: req.user.userId,
      spindleSpeed,
      vibrationLevel,
      toolWear,
      temperature,
      energyConsumption,
    });
    res.status(201).json(device);
  } catch (error) {
    console.error('Error adding device:', error);
    res.status(400).json({ message: 'Failed to add device', error: error.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { spindleSpeed, vibrationLevel, toolWear, temperature, energyConsumption } = req.body;
    const device = await Device.findOne({ where: { id: req.params.id, userId: req.user.userId } });
    if (!device) return res.status(404).json({ message: 'Device not found or unauthorized' });
    await device.update({
      spindleSpeed,
      vibrationLevel,
      toolWear,
      temperature,
      energyConsumption,
      timestamp: new Date(),
    });
    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ message: 'Failed to update device', error: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { id: req.params.id, userId: req.user.userId } });
    if (!device) return res.status(404).json({ message: 'Device not found or unauthorized' });
    await device.destroy();
    res.json({ message: 'Device deleted' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ message: 'Failed to delete device', error: error.message });
  }
});

module.exports = router;