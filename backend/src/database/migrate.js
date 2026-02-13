require('dotenv').config();
const { createTables, dropTables } = require('./schema');
const { pool } = require('../config/database');

const migrate = async () => {
  try {
    console.log('🚀 Starting database migration...');
    
    const action = process.argv[2];
    
    if (action === 'down') {
      await dropTables();
      console.log('✅ Migration down completed');
    } else {
      await createTables();
      console.log('✅ Migration up completed');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
};

migrate();