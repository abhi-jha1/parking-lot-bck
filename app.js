require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi');
const parkingRoutes = require('./routes/parkingRoutes');
const loginRoutes = require('./routes/loginRoutes');

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// 1. Global Middlewares
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 2. Base Diagnostic Route
app.get('/', (req, res) => {
  res.status(200).send('Parking Management System API is live.');
});

app.get('/api-docs.json', (req, res) => {
  res.json(openapiSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use('/api/auth', loginRoutes);

// 3. Mount Application Routes
// This wires up all your parking endpoints under the '/api/parking' base path
app.use('/api/parking', parkingRoutes);

// 4. Global 404 Error Handler for Unknown Endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint route not found' });
});

module.exports = app;
