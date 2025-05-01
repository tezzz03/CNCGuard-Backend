const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { predictRisk } = require('../utils/aiModel');
const { sendEmail } = require('../utils/email');
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

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { spindleSpeed, vibrationLevel, toolWear, temperature, energyConsumption } = req.body;
    if (!spindleSpeed || !vibrationLevel || !toolWear || !temperature || !energyConsumption) {
      return res.status(400).json({ message: 'All sensor data fields are required' });
    }

    const dataPoint = {
      Spindle_Speed_RPM: spindleSpeed,
      Vibration_Level_mm_s: vibrationLevel,
      Tool_Wear_mm: toolWear,
      Temperature_C: temperature,
      Energy_Consumption_kWh: energyConsumption,
    };

    const prediction = await predictRisk(dataPoint);
    const user = await User.findOne({ where: { id: req.user.userId } });

    if (prediction.riskLevel === 'HIGH RISK' && user.notificationEmail) {
      await sendEmail({
        to: user.notificationEmail,
        subject: `CNCGuard Alert: High Risk Detected`,
        text: `Risk Assessment: ${prediction.riskLevel}\nRisk Probability: ${prediction.riskProbability.toFixed(2)}%\nCritical Parameters: ${prediction.criticalParameters.join(', ') || 'None'}\nRecommendations:\n${prediction.recommendations.join('\n')}`,
        // Add attachment logic here if report generation is implemented
      });
    }

    res.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ message: 'Failed to predict', error: error.message });
  }
});

module.exports = router;