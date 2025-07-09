
import dotenv from 'dotenv';

dotenv.config();

import { Pool } from 'pg';
const result = dotenv.config({ debug: true });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('✅ .env file loaded successfully');
}

console.log('🔍 ENV loaded values:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
console.log('DB_PORT:', process.env.DB_PORT);
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

export default pool;


