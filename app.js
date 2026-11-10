const express = require('express');
const cors = require('cors');
const parkingRoutes = require('./routes/parkingRoutes');

const app = express();

// 1. Global Middlewares
app.use(cors());         
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 2. Base Diagnostic Route
app.get('/', (req, res) => {
  res.status(200).send('Parking Management System API is live.');
});

// 3. Mount Application Routes
// This wires up all your parking endpoints under the '/api/parking' base path
app.use('/api/parking', parkingRoutes);

// 4. Global 404 Error Handler for Unknown Endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint route not found' });
});

module.exports = app;
