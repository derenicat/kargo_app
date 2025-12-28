const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
const stationRoutes = require('./src/routes/stationRoutes');
const scenarioRoutes = require('./src/routes/scenarioRoutes');
const optimizeRoutes = require('./src/routes/optimizeRoutes');
const cargoRoutes = require('./src/routes/cargoRoutes');
const vehicleRoutes = require('./src/routes/vehicleRoutes');

app.use('/api/stations', stationRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/optimize', optimizeRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Kargo App Backend is running!');
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ message: 'Database connected successfully', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});