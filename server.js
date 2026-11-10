const app = require('./app');
const db = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 1. Run a lightweight sanity query to test the database pool connection
    await db.query('SELECT 1');
    console.log('Success: Backend connected to MySQL database ("parking_management") via parking_user!');

    // 2. Start listening for incoming traffic from your UI/Postman only after DB connection succeeds
    app.listen(PORT, () => {
      console.log(`Server spinning smoothly at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error: Could not connect to the MySQL database server.');
    console.error('Error Details:', error.message);
    
    // Exit the process immediately with a failure code (1) to prevent a zombie server state
    process.exit(1); 
  }
}

// Execute the boot loader sequence
startServer();
