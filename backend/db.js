
import dotenv from 'dotenv';

dotenv.config();

import { Pool } from 'pg';
const result = dotenv.config({ debug: true });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

pool.on('error', (err, req, res)=>{
  console.log("|DB TERM|");
})

export default pool;


