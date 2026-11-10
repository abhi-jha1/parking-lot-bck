const express = require('express');
require('dotenv').config(); 
const db = require('./config/db'); // Your promise-based pool
const app = express();
const parkingHistory = require('./routes/historyRoutes');

app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use('/api/parking', parkingHistory);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
