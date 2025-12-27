const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const stationRoutes = require('./src/routes/stationRoutes');
const scenarioRoutes = require('./src/routes/scenarioRoutes');
const optimizeRoutes = require('./src/routes/optimizeRoutes');
const cargoRoutes = require('./src/routes/cargoRoutes');

app.use('/api/stations', stationRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/optimize', optimizeRoutes);
app.use('/api/cargo', cargoRoutes);

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