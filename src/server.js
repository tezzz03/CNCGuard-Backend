const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const predictRoutes = require('./routes/predict');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/predict', predictRoutes);

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// Start server
const PORT = process.env.PORT || 5000;
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.error('Database sync error:', err));