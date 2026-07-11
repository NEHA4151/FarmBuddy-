import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

let pool = null;
let isMysql = false;

try {
  let dbUri = process.env.DATABASE_URL || process.env.DB_URL;
  if (dbUri && dbUri.includes('?')) {
    dbUri = dbUri.split('?')[0];
  }
  const connectionConfig = dbUri 
    ? { 
        uri: dbUri,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.DB_HOST || 'mysql-farmbuddy-smart-hub.e.aivencloud.com',
        user: process.env.DB_USER || 'avnadmin',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'defaultdb',
        port: parseInt(process.env.DB_PORT || '12924', 10),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000,
        ssl: {
          rejectUnauthorized: false
        }
      };

  pool = mysql.createPool(connectionConfig);
  
  // Test connection
  const conn = await pool.getConnection();
  console.log('Connected to Cloud MySQL');
  conn.release();
  isMysql = true;
} catch (err) {
  console.warn('MySQL connection failed, falling back to JSON storage:', err.message);
  pool = null;
  isMysql = false;
}

export { pool, isMysql };
