import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbService, calculateBatchHash } from './dbService.js';
import { pool, isMysql } from './db.js';
import { geminiService } from './geminiService.js';
import { calculateGamificationState } from './gamification.js';
import crypto from 'crypto';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Cloudflare R2 Client Initialization
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'farmbuddy-community';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

let s3Client = null;
if (CLOUDFLARE_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  console.log('[Storage Service] Initializing Cloudflare R2 client...');
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY
    }
  });
} else {
  console.warn('[Storage Service] Cloudflare R2 credentials are not defined in server environment (.env). Serving upload files from local disk.');
}

// Ensure public/uploads folder exists locally for fallback mode
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API route: status indicator
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    databaseMode: isMysql ? 'MySQL' : 'JSON Fallback'
  });
});

// Initialize database check for farmers and batch_events tables/arrays
(async () => {
  if (isMysql) {
    try {
      // Check if admins table exists (if not, the schema is incomplete or empty)
      let needsInit = false;
      try {
        await pool.query('SELECT 1 FROM admins LIMIT 1');
      } catch (e) {
        needsInit = true;
      }

      if (needsInit) {
        console.log('MySQL admins table not found. Initializing complete database schema on startup...');
        const { initDb } = await import('./initDb.js');
        await initDb(false); // Do not drop, just create IF NOT EXISTS and seed
        console.log('MySQL database schema initialization and seeding completed.');
      } else {
        // Check if labour_accounts needs update
        try {
          await pool.query('SELECT worker_name FROM labour_accounts LIMIT 1');
        } catch (e) {
          console.log('Recreating labour_accounts to match new schema...');
          await pool.query('DROP TABLE IF EXISTS labour_accounts');
        }

        try {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS labour_accounts (
              id INT AUTO_INCREMENT PRIMARY KEY,
              farmer_id VARCHAR(50) NOT NULL,
              date DATE NOT NULL,
              worker_name VARCHAR(100) NOT NULL,
              gender VARCHAR(10) NOT NULL,
              work_type VARCHAR(100) NOT NULL,
              crop VARCHAR(100) NOT NULL,
              plot VARCHAR(50) DEFAULT NULL,
              hours_worked DECIMAL(5,2) NOT NULL,
              daily_wage DECIMAL(10,2) NOT NULL,
              bonus DECIMAL(10,2) DEFAULT 0.00,
              advance DECIMAL(10,2) DEFAULT 0.00,
              payment_status VARCHAR(20) NOT NULL,
              payment_mode VARCHAR(20) NOT NULL,
              total_amount DECIMAL(12,2) NOT NULL,
              notes TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
        } catch (e) {
          console.error('Error creating labour_accounts table:', e);
        }

        // Run safety alters just in case columns need to be added
        try {
          await pool.query('ALTER TABLE labour_accounts ADD COLUMN duration_female DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER duration');
        } catch (e) {}
        try {
          await pool.query('ALTER TABLE batch_overview ADD COLUMN total_points INT DEFAULT 0');
        } catch (e) {}
        try {
          await pool.query("ALTER TABLE batch_overview ADD COLUMN current_level VARCHAR(50) DEFAULT 'Seedling'");
        } catch (e) {}
        try {
          await pool.query('ALTER TABLE batch_overview ADD COLUMN earned_badges TEXT');
        } catch (e) {}
        try {
          await pool.query('ALTER TABLE batch_overview ADD COLUMN unlocked_rewards TEXT');
        } catch (e) {}
        try {
          await pool.query('ALTER TABLE batch_overview ADD COLUMN activity_streak INT DEFAULT 1');
        } catch (e) {}
        try {
          await pool.query('ALTER TABLE batch_overview ADD COLUMN last_activity_date VARCHAR(50) DEFAULT NULL');
        } catch (e) {}
        try {
          await pool.query('ALTER TABLE batch_overview ADD COLUMN progress_percentage INT DEFAULT 0');
        } catch (e) {}
        try {
          await pool.query('ALTER TABLE batch_overview ADD COLUMN farmer_id VARCHAR(50) DEFAULT "FMR-0921"');
        } catch (e) {}
        try {
          await pool.query('ALTER TABLE batch_overview ADD COLUMN farmer_name VARCHAR(100) DEFAULT "John Doe"');
        } catch (e) {}
        
        try {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS crop_cycles (
              id INT AUTO_INCREMENT PRIMARY KEY,
              farmer_id VARCHAR(50) NOT NULL,
              crop_name VARCHAR(100) NOT NULL,
              plot_identifier VARCHAR(50) DEFAULT NULL,
              start_date DATE NOT NULL,
              end_date DATE DEFAULT NULL,
              status VARCHAR(20) DEFAULT 'ACTIVE',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_farmer_crop (farmer_id, status)
            )
          `);
          await pool.query(`
            CREATE TABLE IF NOT EXISTS credit_contacts (
              id INT AUTO_INCREMENT PRIMARY KEY,
              farmer_id VARCHAR(50) NOT NULL,
              contact_name VARCHAR(150) NOT NULL,
              contact_type VARCHAR(20) NOT NULL,
              phone_number VARCHAR(15) DEFAULT NULL,
              running_balance DECIMAL(12, 2) DEFAULT 0.00,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              UNIQUE KEY uq_farmer_contact (farmer_id, contact_name)
            )
          `);
          await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
              id INT AUTO_INCREMENT PRIMARY KEY,
              farmer_id VARCHAR(50) NOT NULL,
              crop_cycle_id INT DEFAULT NULL,
              credit_contact_id INT DEFAULT NULL,
              transaction_type VARCHAR(10) NOT NULL,
              category VARCHAR(20) NOT NULL,
              amount DECIMAL(12, 2) NOT NULL,
              payment_mode VARCHAR(10) NOT NULL,
              transaction_date DATE NOT NULL,
              notes TEXT DEFAULT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (crop_cycle_id) REFERENCES crop_cycles(id) ON DELETE SET NULL,
              FOREIGN KEY (credit_contact_id) REFERENCES credit_contacts(id) ON DELETE SET NULL,
              INDEX idx_farmer_ledger (farmer_id, transaction_date)
            )
          `);
          await pool.query(`
            CREATE TABLE IF NOT EXISTS kcc_accounts (
              id INT AUTO_INCREMENT PRIMARY KEY,
              farmer_id VARCHAR(50) NOT NULL,
              bank_name VARCHAR(100) NOT NULL,
              sanctioned_limit DECIMAL(12, 2) NOT NULL,
              current_outstanding DECIMAL(12, 2) DEFAULT 0.00,
              base_interest_rate DECIMAL(4, 2) DEFAULT 7.00,
              subvention_interest_rate DECIMAL(4, 2) DEFAULT 4.00,
              subvention_deadline DATE NOT NULL,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              INDEX idx_farmer_kcc (farmer_id)
            )
          `);

          // Create subsidies table
          await pool.query(`
            CREATE TABLE IF NOT EXISTS subsidies (
              id INT AUTO_INCREMENT PRIMARY KEY,
              farmer_id VARCHAR(50) NOT NULL,
              scheme_name VARCHAR(150) NOT NULL,
              amount DECIMAL(12, 2) NOT NULL,
              status VARCHAR(20) NOT NULL,
              date_received DATE DEFAULT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Run ALTER TABLE migrations to preserve existing data safely
          try {
            await pool.query('ALTER TABLE labour_accounts ADD COLUMN overtime DECIMAL(10,2) DEFAULT 0.00 AFTER bonus');
          } catch (e) {}
          try {
            await pool.query('ALTER TABLE crop_cycles ADD COLUMN season VARCHAR(50) DEFAULT NULL AFTER plot_identifier');
          } catch (e) {}
          try {
            await pool.query('ALTER TABLE kcc_accounts ADD COLUMN emi DECIMAL(12,2) DEFAULT 0.00 AFTER sanctioned_limit');
          } catch (e) {}
          try {
            await pool.query('ALTER TABLE kcc_accounts ADD COLUMN due_date DATE DEFAULT NULL AFTER subvention_deadline');
          } catch (e) {}

        } catch (e) {
          console.error('Error creating finance tables on startup:', e);
        }

        console.log('MySQL schema is verified and active.');
      }
    } catch (err) {
      console.error('MySQL database tables initialization error:', err);
    }
  } else {
    try {
      const dbPath = path.join(__dirname, 'database.json');
      if (fs.existsSync(dbPath)) {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        let modified = false;
        
        if (!db.farmers) {
          db.farmers = [];
          modified = true;
        }
        
        if (!db.batch_events) {
          db.batch_events = [];
          modified = true;
        }

        if (!db.crop_cycles) {
          db.crop_cycles = [];
          modified = true;
        }
        if (!db.credit_contacts) {
          db.credit_contacts = [];
          modified = true;
        }
        if (!db.transactions) {
          db.transactions = [];
          modified = true;
        }
        if (!db.kcc_accounts) {
          db.kcc_accounts = [];
          modified = true;
        }
        if (!db.subsidies) {
          db.subsidies = [];
          modified = true;
        }
        if (!db.community_posts) {
          db.community_posts = [];
          modified = true;
        }
        
        if (modified) {
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
        }
      }
    } catch (err) {
      console.error('JSON Farmers array initialization error:', err);
    }
  }

  // Pre-seed default community posts if empty
  async function seedCommunityPostsIfEmpty() {
    try {
      const existing = await dbService.getCommunityPosts();
      if (existing && existing.length > 0) return;

      console.log('[Storage Seeding] Seeding initial community posts...');
      const defaultPosts = [
        {
          author_name: 'Farmer Priya',
          author_username: 'PriyaFarms',
          author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60',
          author_verified: true,
          author_location: 'Pune, Maharashtra',
          content: 'Anyone else seeing this type of leaf curl on their vine tomatoes? Checked the drip lines and they look fine.',
          attachment_url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80',
          attachment_type: 'image',
          crop_tag: 'tomato'
        },
        {
          author_name: 'Rajesh Patil',
          author_username: 'RajeshAgri',
          author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60',
          author_verified: false,
          author_location: 'Nashik, Maharashtra',
          content: 'Just finished transplanting our organic paddy nursery. Soil moisture levels are looking great.',
          attachment_url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80',
          attachment_type: 'image',
          crop_tag: 'rice'
        },
        {
          author_name: 'Emily Smith',
          author_username: 'EmilyCoffee',
          author_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=60',
          author_verified: true,
          author_location: 'Kona Coffee Belt, Hawaii',
          content: 'Pruning the Arabica coffee branches to optimize sunlight exposure. Rains are coming.',
          attachment_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
          attachment_type: 'image',
          crop_tag: 'coffee'
        },
        {
          author_name: 'Marcus Vane',
          author_username: 'MarcusCoffee',
          author_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60',
          author_verified: true,
          author_location: 'Highland Ridge, HI',
          content: 'Check out this video of our shaded nursery setup. The wind-block fences are keeping the young plants safe.',
          attachment_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          attachment_type: 'video',
          crop_tag: 'coffee'
        },
        {
          author_name: 'Soil Dr. Amit',
          author_username: 'DrAmitSoil',
          author_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=60',
          author_verified: true,
          author_location: 'New Delhi, India',
          content: 'Shared a quick voice tip on tomato blight organic control. Listen to the recording!',
          attachment_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          attachment_type: 'audio',
          crop_tag: 'tomato'
        }
      ];

      for (const p of defaultPosts) {
        await dbService.saveCommunityPost(p);
      }
      console.log('[Storage Seeding] Predefined community posts seeded successfully.');
    } catch (err) {
      console.error('[Storage Seeding Error] Failed to seed default community posts:', err);
    }
  }

  await seedCommunityPostsIfEmpty();
})();

async function updateBatchGamificationState(batch_id) {
  try {
    const details = await dbService.getBatchDetails(batch_id);
    if (!details) return null;
    const labour = await dbService.getAllLabourAccounts(batch_id);
    const aiHistory = await dbService.getAiHistory('FMR-0921');
    
    const gamified = calculateGamificationState(details, labour, aiHistory);
    
    if (isMysql) {
      await pool.query(
        `UPDATE batch_overview SET 
          total_points = ?, current_level = ?, earned_badges = ?, 
          unlocked_rewards = ?, activity_streak = ?, last_activity_date = ?, 
          progress_percentage = ?, trust_score = ?
         WHERE batch_id = ?`,
        [
          gamified.totalPoints,
          gamified.currentLevel,
          JSON.stringify(gamified.earnedBadges),
          JSON.stringify(gamified.unlockedRewards),
          gamified.activityStreak,
          gamified.lastActivityDate,
          gamified.progressPercentage,
          gamified.trustScore,
          batch_id
        ]
      );
    } else {
      const dbPath = path.join(__dirname, 'database.json');
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const overview = db.batch_overview.find(b => b.batch_id === batch_id);
      if (overview) {
        overview.total_points = gamified.totalPoints;
        overview.current_level = gamified.currentLevel;
        overview.earned_badges = gamified.earnedBadges;
        overview.unlocked_rewards = gamified.unlockedRewards;
        overview.activity_streak = gamified.activityStreak;
        overview.last_activity_date = gamified.lastActivityDate;
        overview.progress_percentage = gamified.progressPercentage;
        overview.trust_score = gamified.trustScore;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
      }
    }
    return gamified;
  } catch (err) {
    console.error(`Error updating gamification state for batch ${batch_id}:`, err);
    return null;
  }
}

// POST /api/auth/register (Backward compatible legacy register endpoint)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing name, email, or password' });
  }
  try {
    const existingEmail = await dbService.getFarmerByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email address is already registered' });
    }
    const sanitized = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    let farmer_id = `${sanitized}_UVFARMS`;
    const existingId = await dbService.getFarmerById(farmer_id);
    if (existingId || farmer_id === '_UVFARMS') {
      farmer_id = `UVFARMS${Math.floor(1000 + Math.random() * 9000)}`;
    }
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    await dbService.createFarmer({ farmer_id, name, email, password_hash });
    res.status(201).json({ message: 'Registration successful', farmer_id });
  } catch (err) {
    console.error('Error during farmer registration:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { farmer_id, password } = req.body;
  if (!farmer_id || !password) {
    return res.status(400).json({ error: 'Missing farmer_id or password' });
  }

  // Enforce Farmer ID always ends with UVFARMS
  if (!farmer_id.toUpperCase().endsWith('UVFARMS')) {
    return res.status(400).json({ error: 'Invalid Farmer ID' });
  }

  try {
    const farmer = await dbService.getFarmerById(farmer_id);
    if (!farmer) {
      // First-time access: Validate default password "UVFARMS1111"
      if (password !== 'UVFARMS1111') {
        return res.status(400).json({ error: 'Invalid password' });
      }
      // Create record dynamically with is_registered = false and login_count = 1
      await dbService.createFarmer(farmer_id);
      return res.json({
        status: 'first_login_success',
        user: {
          name: 'Farmer',
          email: '',
          role: 'farmer',
          farmerId: farmer_id,
          farmName: 'Green Valley Organic Farm'
        }
      });
    }

    // Farmer exists. Check if registered
    if (!farmer.is_registered) {
      // For unregistered farmer, password must be "UVFARMS1111"
      if (password !== 'UVFARMS1111') {
        return res.status(400).json({ error: 'Invalid password' });
      }
      await dbService.incrementLoginCount(farmer_id);
      return res.json({
        status: 'force_signup',
        farmerId: farmer_id
      });
    }

    // Farmer is registered. Verify password hash (or allow fallback to initial credential 'UVFARMS1111')
    const isMatch = bcrypt.compareSync(password, farmer.password_hash) || password === 'UVFARMS1111';
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    res.json({
      status: 'login_success',
      user: {
        name: farmer.name || 'Farmer',
        email: farmer.email || '',
        role: 'farmer',
        farmerId: farmer.farmer_id,
        farmName: 'Green Valley Organic Farm'
      }
    });
  } catch (err) {
    console.error('Error during farmer login:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// POST /api/auth/complete-registration (Farmer complete first signup)
app.post('/api/auth/complete-registration', async (req, res) => {
  const { farmer_id, name, email, password } = req.body;
  if (!farmer_id || !name || !email || !password) {
    return res.status(400).json({ error: 'Missing registration details' });
  }

  try {
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const success = await dbService.updateFarmerProfile(farmer_id, {
      name,
      email,
      password_hash
    });

    if (success) {
      res.json({ message: 'Registration completed successfully', farmer_id });
    } else {
      res.status(400).json({ error: 'Farmer profile not found for registration update' });
    }
  } catch (err) {
    console.error('Error during registration completion:', err);
    res.status(500).json({ error: 'Failed to complete registration: ' + err.message });
  }
});

// POST /api/auth/admin/register
app.post('/api/auth/admin/register', async (req, res) => {
  const { name, email, password, department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing name, email, or password' });
  }

  try {
    const existing = await dbService.getAdminByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email address is already registered' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const admin = await dbService.createAdmin({
      name,
      email,
      password_hash,
      department
    });

    res.status(201).json({
      message: 'Admin registration successful',
      admin_id: admin.admin_id
    });
  } catch (err) {
    console.error('Error during admin registration:', err);
    res.status(500).json({ error: 'Admin registration failed: ' + err.message });
  }
});

// POST /api/auth/admin/login
app.post('/api/auth/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    const admin = await dbService.getAdminByEmail(email);
    if (!admin) {
      // Default initial admin login fallback for alice@farmbuddy.com / password
      if (email === 'alice@farmbuddy.com' && password === 'password') {
        return res.json({
          status: 'login_success',
          user: {
            name: 'Alice Smith',
            email: email,
            role: 'admin',
            adminId: 'QA-ALICE',
            department: 'Quality Assurance & Trust'
          }
        });
      }
      return res.status(400).json({ error: 'Invalid Admin email or password' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    res.json({
      status: 'login_success',
      user: {
        name: admin.name || 'Admin',
        email: admin.email,
        role: 'admin',
        adminId: admin.admin_id,
        department: admin.department || 'Quality Assurance & Trust'
      }
    });
  } catch (err) {
    console.error('Error during admin login:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// POST /api/batches/:batch_id/batch-events (Record event entry)
app.post('/api/batches/:batch_id/batch-events', async (req, res) => {
  const { batch_id } = req.params;
  const { farmer_id, event_type, event_title, event_description, event_status, trust_score_impact } = req.body;
  
  if (!farmer_id || !event_type || !event_title) {
    return res.status(400).json({ error: 'Missing required event fields' });
  }

  try {
    const event = await dbService.addBatchEvent({
      batch_id,
      farmer_id,
      event_type,
      event_title,
      event_description: event_description || '',
      event_status: event_status || 'Success',
      trust_score_impact: parseFloat(trust_score_impact || 0)
    });
    res.status(201).json(event);
  } catch (err) {
    console.error('Error adding batch event:', err);
    res.status(500).json({ error: 'Failed to log batch event' });
  }
});

// GET /api/batches/:batch_id/batch-events (Fetch all events)
app.get('/api/batches/:batch_id/batch-events', async (req, res) => {
  const { batch_id } = req.params;
  try {
    const events = await dbService.getBatchEvents(batch_id);
    res.json(events);
  } catch (err) {
    console.error('Error fetching batch events:', err);
    res.status(500).json({ error: 'Failed to retrieve batch events' });
  }
});

// API route: Get all batches
app.get('/api/batches', async (req, res) => {
  try {
    const batches = await dbService.getAllBatches();
    res.json(batches);
  } catch (err) {
    console.error('Error fetching batches:', err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// API route: Get grouped timeline logs
app.get('/api/logs', async (req, res) => {
  try {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM cultivation_logs ORDER BY timestamp ASC');
      const grouped = {};
      rows.forEach(log => {
        if (!grouped[log.batch_id]) grouped[log.batch_id] = [];
        let parsedPayload = log.description;
        try {
          if (typeof log.description === 'string' && log.description.trim().startsWith('{')) {
            parsedPayload = JSON.parse(log.description);
          }
        } catch(e) {}
        
        grouped[log.batch_id].push({
          id: log.id || `EVT-${Math.floor(Math.random() * 900) + 100}`,
          timestamp: log.timestamp,
          type: log.activity_type,
          operatorId: 'FMR-0921',
          payload: parsedPayload,
          prevHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          currentHash: log.hash,
          ipfsCid: 'QmYwAPJzv5CZ1zo62FMMn7g8b6A28nU9c5eR7K3m5oA5q8',
          verified: true
        });
      });
      res.json(grouped);
    } else {
      const dbPath = path.join(__dirname, 'database.json');
      if (fs.existsSync(dbPath)) {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const grouped = {};
        (db.cultivation_logs || []).forEach(log => {
          if (!grouped[log.batch_id]) grouped[log.batch_id] = [];
          
          let parsedPayload = log.description;
          try {
            if (typeof log.description === 'string' && log.description.trim().startsWith('{')) {
              parsedPayload = JSON.parse(log.description);
            }
          } catch(e) {}

          grouped[log.batch_id].push({
            id: log.id || `EVT-${Math.floor(Math.random() * 900) + 100}`,
            timestamp: log.timestamp,
            type: log.activity_type,
            operatorId: 'FMR-0921',
            payload: parsedPayload,
            prevHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            currentHash: log.hash,
            ipfsCid: 'QmYwAPJzv5CZ1zo62FMMn7g8b6A28nU9c5eR7K3m5oA5q8',
            verified: true
          });
        });
        res.json(grouped);
      } else {
        res.json({});
      }
    }
  } catch (err) {
    console.error('Error fetching grouped logs:', err);
    res.status(500).json({ error: 'Failed to fetch timeline logs' });
  }
});

// API route: Get detailed batch info
app.get('/api/batches/:batch_id', async (req, res) => {
  const { batch_id } = req.params;
  try {
    const details = await dbService.getBatchDetails(batch_id);
    if (!details) {
      return res.status(404).json({ error: `Batch ${batch_id} not found` });
    }
    res.json(details);
  } catch (err) {
    console.error(`Error fetching details for batch ${batch_id}:`, err);
    res.status(500).json({ error: 'Failed to fetch batch details' });
  }
});

// API route: Verify ledger integrity
app.get('/api/batches/:batch_id/verify', async (req, res) => {
  const { batch_id } = req.params;
  try {
    // Step 1: Fetch full batch data from MySQL using Batch ID
    const details = await dbService.getBatchDetails(batch_id);
    if (!details) {
      return res.status(404).json({ error: `Batch ${batch_id} not found` });
    }

    // Step 2: Generate a fresh SHA-256 hash from fetched MySQL data
    const currentHash = calculateBatchHash(details);

    // Step 3: Fetch the original stored hash from immudb
    let originalHash = await dbService.getImmudbHash(batch_id);
    
    // Fallback if immudb hash doesn't exist yet
    if (!originalHash) {
      originalHash = details.blockchain_hash || currentHash;
      await dbService.storeImmudbHash(batch_id, originalHash);
    }

    // Step 4: Compare both hashes
    const isVerified = (currentHash === originalHash);
    const matchStatus = isVerified ? 'VERIFIED' : 'TAMPERED_OR_MISMATCH';

    if (!isVerified) {
      // Log tampering event to verification_logs if not already logged
      const existingLogs = details.verification_logs || [];
      const isLogged = existingLogs.some(log => log.current_hash === currentHash && log.original_hash === originalHash);
      if (!isLogged) {
        await dbService.addVerificationLog(batch_id, originalHash, currentHash, 'Tampering Detected');
      }
    }

    // Refresh details to include the new verification log
    const updatedDetails = await dbService.getBatchDetails(batch_id);

    res.json({
      batch_id,
      verified: isVerified,
      current_hash: currentHash, // Generated Hash (from MySQL data)
      blockchain_hash: originalHash, // Original Hash (from immudb)
      match_status: matchStatus,
      verification_logs: updatedDetails.verification_logs || [],
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(`Error verifying batch ${batch_id}:`, err);
    res.status(500).json({ error: 'Failed to perform verification' });
  }
});

// API route: Simulate data tampering
app.post('/api/batches/:batch_id/tamper', async (req, res) => {
  const { batch_id } = req.params;
  try {
    const details = await dbService.getBatchDetails(batch_id);
    if (!details) {
      return res.status(404).json({ error: `Batch ${batch_id} not found` });
    }

    await dbService.tamperBatch(batch_id);
    const tamperedDetails = await dbService.getBatchDetails(batch_id);
    const currentHash = calculateBatchHash(tamperedDetails);

    res.json({
      message: 'Batch details tampered successfully',
      batch_id,
      previous_hash: details.blockchain_hash,
      new_hash: currentHash,
      tamperedDetails
    });
  } catch (err) {
    console.error(`Error tampering batch ${batch_id}:`, err);
    res.status(500).json({ error: 'Failed to simulate tampering' });
  }
});

// API route: Restore database integrity
app.post('/api/batches/:batch_id/restore', async (req, res) => {
  const { batch_id } = req.params;
  try {
    const details = await dbService.getBatchDetails(batch_id);
    if (!details) {
      return res.status(404).json({ error: `Batch ${batch_id} not found` });
    }

    await dbService.restoreBatch(batch_id);
    const restoredDetails = await dbService.getBatchDetails(batch_id);
    const currentHash = calculateBatchHash(restoredDetails);

    res.json({
      message: 'Batch details restored successfully',
      batch_id,
      blockchain_hash: details.blockchain_hash,
      current_hash: currentHash,
      restoredDetails
    });
  } catch (err) {
    console.error(`Error restoring batch ${batch_id}:`, err);
    res.status(500).json({ error: 'Failed to restore database integrity' });
  }
});

// API route: Create a new batch
app.post('/api/batches', async (req, res) => {
  const { cropType, seedDate, expectedHarvestDate, location, soilType, notes, imageUrl, farmerId, farmerName } = req.body;
  try {
    const batches = await dbService.getAllBatches();
    const newId = `FB-2026-${String(batches.length + 1).padStart(3, '0')}`;

    const batch_overview = {
      batch_id: newId,
      crop_name: cropType,
      crop_image: imageUrl || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
      farm_name: 'Green Valley Organic Farm',
      farm_location: location || 'Green Valley Farm',
      cultivation_type: soilType || 'Standard',
      sowing_date: seedDate || new Date().toISOString().split('T')[0],
      expected_harvest: expectedHarvestDate || null,
      status: 'Growing',
      trust_score: 95,
      blockchain_hash: '', // Calculated below
      farmer_id: farmerId || 'FMR-0921',
      farmer_name: farmerName || 'John Doe'
    };

    const pre_cultivation = {
      soil_test_status: 'Passed',
      heavy_metal_status: 'Passed',
      water_quality: 'Passed',
      seed_provenance: 'Certified Rootstock',
      buffer_zone_check: 'Passed'
    };

    const harvest_qa = {
      harvest_date: null,
      total_yield: 'Pending',
      marketable_yield: 'Pending',
      qa_status: 'Pending',
      residue_free: true,
      quality_notes: notes || 'Batch initialized.'
    };

    const transit_retail = {
      pre_cooling_status: 'Pending',
      dispatch_date: null,
      transport_status: 'Pending',
      retail_handover: 'Pending',
      delivery_status: 'In Fields'
    };

    const cultivation_logs = [
      {
        activity_type: 'Batch Created',
        description: `Batch created: ${cropType} in ${location}.`,
        timestamp: new Date().toISOString(),
        hash: '0x' + crypto.randomBytes(32).toString('hex')
      }
    ];

    // Compute dynamic hash
    const fullState = {
      ...batch_overview,
      ...pre_cultivation,
      ...harvest_qa,
      ...transit_retail
    };
    const blockchainHash = calculateBatchHash(fullState);
    batch_overview.blockchain_hash = blockchainHash;

    await dbService.createBatch({
      batch_overview,
      pre_cultivation,
      harvest_qa,
      transit_retail,
      cultivation_logs
    });

    await updateBatchGamificationState(newId);

    res.status(201).json({
      message: 'Batch created successfully',
      batch_id: newId,
      blockchain_hash: blockchainHash
    });
  } catch (err) {
    console.error('Error creating batch:', err);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

// API route: Add event to batch timeline
app.post('/api/batches/:batch_id/event', async (req, res) => {
  const { batch_id } = req.params;
  const { eventType, description } = req.body;
  try {
    const details = await dbService.getBatchDetails(batch_id);
    if (!details) {
      return res.status(404).json({ error: `Batch ${batch_id} not found` });
    }

    // In a production app, we would append to cultivation_logs and update status in batch_overview.
    // For local fallback: we append the log to database.json or mysql
    const timestamp = new Date().toISOString();
    const eventHash = '0x' + crypto.randomBytes(32).toString('hex');

    if (isMysql) {
      await pool.query(
        `INSERT INTO cultivation_logs (batch_id, activity_type, description, timestamp, hash)
         VALUES (?, ?, ?, ?, ?)`,
        [batch_id, eventType, description, new Date(), eventHash]
      );
      
      // Update status if applicable
      let newStatus = details.status;
      if (eventType === 'Crop Harvested') newStatus = 'In Quality Check';
      if (eventType === 'QA Approved') newStatus = 'QA Approved';
      if (eventType === 'QA Rejected') newStatus = 'QA Rejected';
      if (eventType === 'Shipped') newStatus = 'Shipped';
      
      if (newStatus !== details.status) {
        await pool.query(
          `UPDATE batch_overview SET status = ? WHERE batch_id = ?`,
          [newStatus, batch_id]
        );
      }
    } else {
      const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'database.json'), 'utf8'));
      db.cultivation_logs.push({
        id: db.cultivation_logs.length + 1,
        batch_id,
        activity_type: eventType,
        description,
        timestamp,
        hash: eventHash
      });

      const overview = db.batch_overview.find(b => b.batch_id === batch_id);
      if (overview) {
        let newStatus = overview.status;
        if (eventType === 'Crop Harvested') newStatus = 'In Quality Check';
        if (eventType === 'QA Approved') newStatus = 'QA Approved';
        if (eventType === 'QA Rejected') newStatus = 'QA Rejected';
        if (eventType === 'Shipped') newStatus = 'Shipped';
        overview.status = newStatus;
      }
      fs.writeFileSync(path.join(__dirname, 'database.json'), JSON.stringify(db, null, 2), 'utf8');
    }

    // Generate fresh hash and update immudb ledger
    const updatedHash = await dbService.updateBatchHashAndLedger(batch_id);

    // Update gamification state
    await updateBatchGamificationState(batch_id);

    res.status(201).json({
      message: 'Event logged successfully',
      batch_id,
      eventType,
      hash: eventHash,
      blockchain_hash: updatedHash
    });
  } catch (err) {
    console.error('Error adding event:', err);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

// API route: Central Multimodal AI Assistant
app.post('/api/ai/assistant', async (req, res) => {
  const { type, query, image, mimeType, audio, transcript, farmer_id } = req.body;
  const fId = farmer_id || 'FMR-0921';

  try {
    if (type === 'text') {
      if (!query) return res.status(400).json({ error: 'Query is required for text AI requests' });
      
      const responseText = await geminiService.chatText(query);
      
      await dbService.saveAiChat({
        farmer_id: fId,
        input_type: 'text',
        user_query: query,
        ai_response: responseText
      });

      try {
        const batches = await dbService.getAllBatches();
        for (const b of batches) {
          await updateBatchGamificationState(b.batch_id);
        }
      } catch (err) {
        console.error('Failed to update gamification on AI query:', err);
      }

      return res.json({ response: responseText });
    }
    
    else if (type === 'image') {
      if (!image) return res.status(400).json({ error: 'Image data is required for vision AI requests' });
      
      const result = await geminiService.analyzeImage(query, image, mimeType || 'image/jpeg');
      
      await dbService.saveAiChat({
        farmer_id: fId,
        input_type: 'image',
        image_url: image, // base64 so we can render it in the frontend history preview
        user_query: query || 'Identify leaf status',
        ai_response: result.response,
        detected_issue: result.issue,
        confidence_score: result.confidence,
        recommendations: result.recommendations
      });

      try {
        const batches = await dbService.getAllBatches();
        for (const b of batches) {
          await updateBatchGamificationState(b.batch_id);
        }
      } catch (err) {
        console.error('Failed to update gamification on AI query:', err);
      }

      return res.json({
        response: result.response,
        issue: result.issue,
        confidence: result.confidence,
        recommendations: result.recommendations
      });
    }
    
    else {
      return res.status(400).json({ error: 'Invalid AI request type. Must be "text" or "image".' });
    }
  } catch (err) {
    console.error('Error in /api/ai/assistant:', err);
    res.status(500).json({ error: 'Internal AI Assistant server error: ' + err.message });
  }
});

// API route: Get AI History
app.get('/api/ai/history', async (req, res) => {
  const { farmer_id } = req.query;
  try {
    const history = await dbService.getAiHistory(farmer_id || 'FMR-0921');
    res.json(history);
  } catch (err) {
    console.error('Error fetching AI history:', err);
    res.status(500).json({ error: 'Failed to fetch AI assistant history' });
  }
});

// API route: Get Leaderboard among farmers
app.get('/api/leaderboard', async (req, res) => {
  const { farmerName } = req.query;
  try {
    const batches = await dbService.getAllBatches();
    const farmerStats = {};
    
    // Ensure John Doe is always represented
    farmerStats['John Doe'] = {
      name: 'John Doe',
      totalPoints: 0,
      totalBadges: 0,
      trustScoreSum: 0,
      batchCount: 0,
      badges: new Set()
    };
    
    batches.forEach(b => {
      let name = b.farmer_name;
      if (!name || name === 'John Doe') {
        name = farmerName || 'John Doe';
      }
      if (!farmerStats[name]) {
        farmerStats[name] = {
          name: name,
          totalPoints: 0,
          totalBadges: 0,
          trustScoreSum: 0,
          batchCount: 0,
          badges: new Set()
        };
      }
      
      const stats = farmerStats[name];
      stats.totalPoints += b.total_points || 0;
      stats.trustScoreSum += b.trust_score || 95;
      stats.batchCount += 1;
      
      if (b.earned_badges) {
        const badgesArr = Array.isArray(b.earned_badges) 
          ? b.earned_badges 
          : (typeof b.earned_badges === 'string' ? JSON.parse(b.earned_badges) : []);
        badgesArr.forEach(badge => stats.badges.add(badge));
      }
    });

    const realFarmers = Object.keys(farmerStats).map(name => {
      const stats = farmerStats[name];
      return {
        name: name,
        totalPoints: stats.totalPoints,
        totalBadges: stats.badges.size,
        trustScore: stats.batchCount > 0 ? Math.round(stats.trustScoreSum / stats.batchCount) : 95
      };
    });

    const mockFarmers = [
      { name: 'Aarav Patel', totalPoints: 780, totalBadges: 11, trustScore: 98 },
      { name: 'Marcus Vane', totalPoints: 690, totalBadges: 9, trustScore: 97 },
      { name: 'Priya Sharma', totalPoints: 540, totalBadges: 8, trustScore: 96 },
      { name: 'Carlos Mendez', totalPoints: 490, totalBadges: 7, trustScore: 95 },
      { name: 'Liam Johnson', totalPoints: 420, totalBadges: 6, trustScore: 94 },
      { name: 'Yuki Tanaka', totalPoints: 380, totalBadges: 6, trustScore: 95 },
      { name: 'Fatima Al-Sayed', totalPoints: 310, totalBadges: 5, trustScore: 93 },
      { name: 'Elena Rostova', totalPoints: 260, totalBadges: 4, trustScore: 92 },
      { name: 'Lazy Larry', totalPoints: 0, totalBadges: 0, trustScore: 7 },
      { name: 'Novice Nancy', totalPoints: 0, totalBadges: 0, trustScore: 4 }
    ];

    const combined = [...realFarmers];
    mockFarmers.forEach(mf => {
      if (!combined.some(rf => rf.name.toLowerCase() === mf.name.toLowerCase())) {
        combined.push(mf);
      }
    });

    combined.forEach(f => {
      if (f.totalPoints === 0 && f.totalBadges === 0) {
        // Enforce 0-10% trust score for farmers with no activity
        f.trustScore = Math.max(0, Math.min(10, f.trustScore));
      }
    });

    combined.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.totalBadges !== a.totalBadges) {
        return b.totalBadges - a.totalBadges;
      }
      return b.trustScore - a.trustScore;
    });

    const leaderboard = combined.map((f, idx) => ({
      rank: idx + 1,
      name: f.name,
      totalPoints: f.totalPoints,
      totalBadges: f.totalBadges,
      trustScore: f.trustScore
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error('Error generating leaderboard:', err);
    res.status(500).json({ error: 'Failed to generate leaderboard' });
  }
});

// API route: Save batch QR code path
app.post('/api/batches/:batch_id/qr', async (req, res) => {
  const { batch_id } = req.params;
  const { qr_code } = req.body;
  if (!qr_code) {
    return res.status(400).json({ error: 'qr_code is required' });
  }
  try {
    await dbService.saveQrCode(batch_id, qr_code);
    await updateBatchGamificationState(batch_id);
    res.json({ message: 'QR Code saved successfully' });
  } catch (err) {
    console.error('Error saving QR code:', err);
    res.status(500).json({ error: 'Failed to save QR code' });
  }
});

// API route: Get all reports
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await dbService.getAllReports();
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// API route: Save report
app.post('/api/reports', async (req, res) => {
  const { name, type, content } = req.body;
  if (!name || !type || !content) {
    return res.status(400).json({ error: 'Missing name, type, or content' });
  }
  try {
    const report = await dbService.saveReport({ name, type, content });
    res.status(201).json(report);
  } catch (err) {
    console.error('Error saving report:', err);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// API route: Delete report
app.delete('/api/reports/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const success = await dbService.deleteReport(id);
    if (!success) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error('Error deleting report:', err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// API route: Upload file to Cloudflare R2 or local disk fallback
app.post('/api/community/upload', async (req, res) => {
  const { name, content, mimeType } = req.body;
  if (!name || !content || !mimeType) {
    return res.status(400).json({ error: 'Missing name, content, or mimeType' });
  }

  const cleanBase64 = content.replace(/^data:.*?;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  const fileName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;

  try {
    if (s3Client) {
      // Upload to Cloudflare R2
      console.log(`[Storage] Uploading ${fileName} to Cloudflare R2 bucket: ${R2_BUCKET_NAME}`);
      await s3Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: mimeType
      }));

      const publicUrl = R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL}/${fileName}`
        : `https://${R2_BUCKET_NAME}.${CLOUDFLARE_ACCOUNT_ID}.r2.dev/${fileName}`;
      
      console.log(`[Storage] Uploaded to Cloudflare R2 successfully: ${publicUrl}`);
      res.json({ url: publicUrl });
    } else {
      // Local disk upload fallback
      const filePath = path.join(uploadsDir, fileName);
      console.log(`[Storage] Saving ${fileName} locally to disk: ${filePath}`);
      fs.writeFileSync(filePath, buffer);
      
      // Build a fully qualified URL back to the local Express server
      const host = req.get('host') || `localhost:${port}`;
      const protocol = req.protocol || 'http';
      const publicUrl = `${protocol}://${host}/uploads/${fileName}`;
      
      console.log(`[Storage] Saved locally successfully: ${publicUrl}`);
      res.json({ url: publicUrl });
    }
  } catch (err) {
    console.error('[Storage Error] Failed to upload media file:', err);
    res.status(500).json({ error: 'Failed to upload media file: ' + err.message });
  }
});

// API route: Get community posts
app.get('/api/community/posts', async (req, res) => {
  try {
    const posts = await dbService.getCommunityPosts();
    res.json(posts);
  } catch (err) {
    console.error('Error fetching community posts:', err);
    res.status(500).json({ error: 'Failed to fetch community posts' });
  }
});

// API route: Save community post
app.post('/api/community/posts', async (req, res) => {
  const { author_name, author_username, author_avatar, author_verified, author_location, content, attachment_url, attachment_type, crop_tag } = req.body;
  
  if (!author_name || !author_username) {
    return res.status(400).json({ error: 'Missing author name or username' });
  }

  try {
    const post = await dbService.saveCommunityPost({
      author_name,
      author_username,
      author_avatar,
      author_verified: !!author_verified,
      author_location,
      content,
      attachment_url,
      attachment_type,
      crop_tag
    });
    res.status(201).json(post);
  } catch (err) {
    console.error('Error saving community post:', err);
    res.status(500).json({ error: 'Failed to save community post' });
  }
});

// API route: Get latest telemetry
app.get('/api/telemetry', async (req, res) => {
  try {
    const telemetry = await dbService.getLatestTelemetry();
    res.json(telemetry);
  } catch (err) {
    console.error('Error fetching telemetry:', err);
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

// API routes: Labour Accounts
app.get('/api/labour', async (req, res) => {
  const { farmerId } = req.query;
  if (!farmerId) {
    return res.status(400).json({ error: 'Missing farmerId parameter' });
  }
  try {
    const records = await dbService.getAllLabourAccounts(farmerId);
    res.json(records);
  } catch (err) {
    console.error(`Error fetching labour accounts for farmer ${farmerId}:`, err);
    res.status(500).json({ error: 'Failed to fetch labour accounts' });
  }
});

app.post('/api/labour', async (req, res) => {
  const { farmer_id, date, worker_name, gender, work_type, crop, plot, hours_worked, daily_wage, bonus, overtime, advance, payment_status, payment_mode, notes } = req.body;
  if (!farmer_id || !date || !worker_name || !gender || !work_type || !crop || hours_worked === undefined || daily_wage === undefined || !payment_status || !payment_mode) {
    return res.status(400).json({ error: 'Missing required labour fields' });
  }
  if (parseFloat(hours_worked) <= 0) {
    return res.status(400).json({ error: 'Duration (hours worked) must be greater than 0' });
  }
  if (parseFloat(daily_wage) < 0) {
    return res.status(400).json({ error: 'Daily wage must be greater than or equal to 0' });
  }
  if (overtime !== undefined && parseFloat(overtime) < 0) {
    return res.status(400).json({ error: 'Overtime must be greater than or equal to 0' });
  }
  try {
    const record = await dbService.createLabourAccount({
      farmer_id,
      date,
      worker_name,
      gender,
      work_type,
      crop,
      plot,
      hours_worked,
      daily_wage,
      bonus: bonus || 0,
      overtime: overtime || 0,
      advance: advance || 0,
      payment_status,
      payment_mode,
      notes
    });
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating labour account:', err);
    res.status(500).json({ error: 'Failed to create labour account' });
  }
});

app.put('/api/labour/:id', async (req, res) => {
  const { id } = req.params;
  const { farmer_id, date, worker_name, gender, work_type, crop, plot, hours_worked, daily_wage, bonus, overtime, advance, payment_status, payment_mode, notes } = req.body;
  if (!date || !worker_name || !gender || !work_type || !crop || hours_worked === undefined || daily_wage === undefined || !payment_status || !payment_mode) {
    return res.status(400).json({ error: 'Missing required fields for update' });
  }
  if (parseFloat(hours_worked) <= 0) {
    return res.status(400).json({ error: 'Duration (hours worked) must be greater than 0' });
  }
  if (parseFloat(daily_wage) < 0) {
    return res.status(400).json({ error: 'Daily wage must be greater than or equal to 0' });
  }
  if (overtime !== undefined && parseFloat(overtime) < 0) {
    return res.status(400).json({ error: 'Overtime must be greater than or equal to 0' });
  }
  try {
    const record = await dbService.updateLabourAccount(id, {
      farmer_id,
      date,
      worker_name,
      gender,
      work_type,
      crop,
      plot,
      hours_worked,
      daily_wage,
      bonus: bonus || 0,
      overtime: overtime || 0,
      advance: advance || 0,
      payment_status,
      payment_mode,
      notes
    });
    if (!record) {
      return res.status(404).json({ error: 'Labour account not found' });
    }
    res.json(record);
  } catch (err) {
    console.error('Error updating labour account:', err);
    res.status(500).json({ error: 'Failed to update labour account' });
  }
});

app.delete('/api/labour/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const success = await dbService.deleteLabourAccount(id);
    if (!success) {
      return res.status(404).json({ error: 'Labour account not found' });
    }
    res.json({ message: 'Labour account deleted successfully' });
  } catch (err) {
    console.error('Error deleting labour account:', err);
    res.status(500).json({ error: 'Failed to delete labour account' });
  }
});

// --- FINANCE MODULE ENDPOINTS ---

// Crop Cycles
app.get('/api/crop-cycles', async (req, res) => {
  const farmerId = req.query.farmerId || 'FMR-0921';
  try {
    const cycles = await dbService.getAllCropCycles(farmerId);
    res.json(cycles);
  } catch (err) {
    console.error('Error fetching crop cycles:', err);
    res.status(500).json({ error: 'Failed to fetch crop cycles' });
  }
});

app.post('/api/crop-cycles', async (req, res) => {
  const { farmer_id, crop_name, plot_identifier, season, start_date, end_date, status } = req.body;
  if (!farmer_id || !crop_name || !start_date) {
    return res.status(400).json({ error: 'Missing required crop cycle fields' });
  }
  
  // Prevent duplicate crop cycles for the same plot and season
  if (plot_identifier && season) {
    try {
      let isDuplicate = false;
      if (isMysql) {
        const [rows] = await pool.query(
          'SELECT 1 FROM crop_cycles WHERE farmer_id = ? AND plot_identifier = ? AND season = ? LIMIT 1',
          [farmer_id, plot_identifier, season]
        );
        isDuplicate = rows.length > 0;
      } else {
        const dbPath = path.join(__dirname, 'database.json');
        if (fs.existsSync(dbPath)) {
          const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          isDuplicate = (db.crop_cycles || []).some(
            c => c.farmer_id === farmer_id && c.plot_identifier === plot_identifier && c.season === season
          );
        }
      }
      if (isDuplicate) {
        return res.status(400).json({ error: `A crop cycle already exists for Plot "${plot_identifier}" during Season "${season}".` });
      }
    } catch (e) {
      console.error('Error validating crop cycle uniqueness:', e);
    }
  }

  try {
    const cycle = await dbService.createCropCycle({ farmer_id, crop_name, plot_identifier, season, start_date, end_date, status });
    res.status(201).json(cycle);
  } catch (err) {
    console.error('Error creating crop cycle:', err);
    res.status(500).json({ error: 'Failed to create crop cycle' });
  }
});

app.put('/api/crop-cycles/:id', async (req, res) => {
  const { id } = req.params;
  const { crop_name, plot_identifier, season, start_date, end_date, status } = req.body;
  try {
    const updated = await dbService.updateCropCycle(id, { crop_name, plot_identifier, season, start_date, end_date, status });
    if (!updated) return res.status(404).json({ error: 'Crop cycle not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating crop cycle:', err);
    res.status(500).json({ error: 'Failed to update crop cycle' });
  }
});

app.delete('/api/crop-cycles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const success = await dbService.deleteCropCycle(id);
    if (!success) return res.status(404).json({ error: 'Crop cycle not found' });
    res.json({ message: 'Crop cycle deleted successfully' });
  } catch (err) {
    console.error('Error deleting crop cycle:', err);
    res.status(500).json({ error: 'Failed to delete crop cycle' });
  }
});

// Credit Contacts
app.get('/api/credit-contacts', async (req, res) => {
  const farmerId = req.query.farmerId || 'FMR-0921';
  try {
    const contacts = await dbService.getAllCreditContacts(farmerId);
    res.json(contacts);
  } catch (err) {
    console.error('Error fetching credit contacts:', err);
    res.status(500).json({ error: 'Failed to fetch credit contacts' });
  }
});

app.post('/api/credit-contacts', async (req, res) => {
  const { farmer_id, contact_name, contact_type, phone_number, running_balance } = req.body;
  if (!farmer_id || !contact_name || !contact_type) {
    return res.status(400).json({ error: 'Missing required credit contact fields' });
  }
  try {
    const contact = await dbService.createCreditContact({ farmer_id, contact_name, contact_type, phone_number, running_balance });
    res.status(201).json(contact);
  } catch (err) {
    console.error('Error creating credit contact:', err);
    res.status(500).json({ error: 'Failed to create credit contact' });
  }
});

app.put('/api/credit-contacts/:id', async (req, res) => {
  const { id } = req.params;
  const { contact_name, contact_type, phone_number, running_balance } = req.body;
  try {
    const updated = await dbService.updateCreditContact(id, { contact_name, contact_type, phone_number, running_balance });
    if (!updated) return res.status(404).json({ error: 'Credit contact not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating credit contact:', err);
    res.status(500).json({ error: 'Failed to update credit contact' });
  }
});

app.delete('/api/credit-contacts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const success = await dbService.deleteCreditContact(id);
    if (!success) return res.status(404).json({ error: 'Credit contact not found' });
    res.json({ message: 'Credit contact deleted successfully' });
  } catch (err) {
    console.error('Error deleting credit contact:', err);
    res.status(500).json({ error: 'Failed to delete credit contact' });
  }
});

// Transactions
app.get('/api/transactions', async (req, res) => {
  const farmerId = req.query.farmerId || 'FMR-0921';
  try {
    const txs = await dbService.getAllTransactions(farmerId);
    res.json(txs);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', async (req, res) => {
  const { farmer_id, crop_cycle_id, credit_contact_id, transaction_type, category, amount, payment_mode, transaction_date, notes } = req.body;
  if (!farmer_id || !transaction_type || !category || !amount || !payment_mode || !transaction_date) {
    return res.status(400).json({ error: 'Missing required transaction fields' });
  }
  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Transaction amount must be greater than 0' });
  }
  try {
    const tx = await dbService.createTransaction({ farmer_id, crop_cycle_id, credit_contact_id, transaction_type, category, amount, payment_mode, transaction_date, notes });
    res.status(201).json(tx);
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { farmer_id, crop_cycle_id, credit_contact_id, transaction_type, category, amount, payment_mode, transaction_date, notes } = req.body;
  if (!farmer_id || !transaction_type || !category || !amount || !payment_mode || !transaction_date) {
    return res.status(400).json({ error: 'Missing required fields for update' });
  }
  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Transaction amount must be greater than 0' });
  }
  try {
    const tx = await dbService.updateTransaction(id, { farmer_id, crop_cycle_id, credit_contact_id, transaction_type, category, amount, payment_mode, transaction_date, notes });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json(tx);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const success = await dbService.deleteTransaction(id);
    if (!success) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Subsidies API
app.get('/api/subsidies', async (req, res) => {
  const farmerId = req.query.farmerId || 'FMR-0921';
  try {
    const subsidies = await dbService.getAllSubsidies(farmerId);
    res.json(subsidies);
  } catch (err) {
    console.error('Error fetching subsidies:', err);
    res.status(500).json({ error: 'Failed to fetch subsidies' });
  }
});

app.post('/api/subsidies', async (req, res) => {
  const { farmer_id, scheme_name, amount, status, date_received } = req.body;
  if (!farmer_id || !scheme_name || amount === undefined || !status) {
    return res.status(400).json({ error: 'Missing required subsidy fields' });
  }
  if (parseFloat(amount) < 0) {
    return res.status(400).json({ error: 'Amount must be greater than or equal to 0' });
  }
  try {
    const subsidy = await dbService.createSubsidy({ farmer_id, scheme_name, amount, status, date_received });
    res.status(201).json(subsidy);
  } catch (err) {
    console.error('Error creating subsidy:', err);
    res.status(500).json({ error: 'Failed to create subsidy' });
  }
});

app.put('/api/subsidies/:id', async (req, res) => {
  const { id } = req.params;
  const { scheme_name, amount, status, date_received } = req.body;
  if (!scheme_name || amount === undefined || !status) {
    return res.status(400).json({ error: 'Missing required fields for update' });
  }
  if (parseFloat(amount) < 0) {
    return res.status(400).json({ error: 'Amount must be greater than or equal to 0' });
  }
  try {
    const subsidy = await dbService.updateSubsidy(id, { scheme_name, amount, status, date_received });
    if (!subsidy) return res.status(404).json({ error: 'Subsidy not found' });
    res.json(subsidy);
  } catch (err) {
    console.error('Error updating subsidy:', err);
    res.status(500).json({ error: 'Failed to update subsidy' });
  }
});

app.delete('/api/subsidies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const success = await dbService.deleteSubsidy(id);
    if (!success) return res.status(404).json({ error: 'Subsidy not found' });
    res.json({ message: 'Subsidy deleted successfully' });
  } catch (err) {
    console.error('Error deleting subsidy:', err);
    res.status(500).json({ error: 'Failed to delete subsidy' });
  }
});

// KCC Accounts
app.get('/api/kcc-accounts', async (req, res) => {
  const farmerId = req.query.farmerId || 'FMR-0921';
  try {
    const kcc = await dbService.getKccAccounts(farmerId);
    res.json(kcc);
  } catch (err) {
    console.error('Error fetching KCC accounts:', err);
    res.status(500).json({ error: 'Failed to fetch KCC accounts' });
  }
});

app.post('/api/kcc-accounts', async (req, res) => {
  const { farmer_id, bank_name, sanctioned_limit, emi, current_outstanding, base_interest_rate, subvention_interest_rate, subvention_deadline, due_date } = req.body;
  if (!farmer_id || !bank_name || sanctioned_limit === undefined || !subvention_deadline) {
    return res.status(400).json({ error: 'Missing required KCC fields' });
  }
  try {
    const kcc = await dbService.createOrUpdateKccAccount({ farmer_id, bank_name, sanctioned_limit, emi, current_outstanding, base_interest_rate, subvention_interest_rate, subvention_deadline, due_date });
    res.json(kcc);
  } catch (err) {
    console.error('Error updating KCC account:', err);
    res.status(500).json({ error: 'Failed to update KCC account' });
  }
});

// Serve static assets from the Vite frontend build folder
app.use(express.static(path.join(__dirname, '../dist')));

// Serve index.html for all other non-API routes to support client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Database Mode: ${isMysql ? 'MySQL' : 'JSON Fallback'}`);
  
  // Startup Gemini API key check
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("[Startup Error] GEMINI_API_KEY is not defined in server environment (.env)!");
  } else {
    console.log(`[Startup] GEMINI_API_KEY loaded successfully (starts with "${key.substring(0, 5)}...").`);
    if (!key.startsWith('AIza') && !key.startsWith('AQ.')) {
      console.warn("[Startup Warning] GEMINI_API_KEY does not start with standard prefixes ('AIza' or 'AQ.'). Ensure it is correct.");
    }
  }
});
