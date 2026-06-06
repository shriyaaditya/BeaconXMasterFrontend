require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cacheService = require('./services/cacheService');
const idrnRoutes = require('./routes/idrnRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const simulatorRoutes = require('./routes/simulatorRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) so the Next.js frontend can connect
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Cache (Redis connection with offline map fallback)
cacheService.initCache().then(() => {
  console.log('Cache initialization complete.');
});

// Mounting API routes
app.use('/api/idrn', idrnRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/simulator', simulatorRoutes);

// Default status healthcheck route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    redisConnected: cacheService.getIsRedisConnected()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server exception:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error occurred on the BeaconX backend.'
  });
});

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`BeaconX backend EOC system running on port ${PORT}`);
  console.log(`Mode: ${process.env.USE_MOCK_DATA === 'true' ? 'MOCK_DATA' : 'LIVE_IDRN_GATEWAY'}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`========================================================`);
});
