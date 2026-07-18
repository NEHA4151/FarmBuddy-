import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, isMysql } from './db.js';
import { calculateBatchHash, dbService } from './dbService.js';

const initialBatchesData = [
  {
    batch_overview: {
      batch_id: 'FB-2026-001',
      crop_name: 'Organic Honeycrisp Apples',
      crop_image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
      farm_name: 'Green Valley Organic Farm',
      farm_location: 'Section 4B, Green Valley Organic Farm, CA',
      cultivation_type: 'Organic Drip',
      sowing_date: '2026-04-10',
      expected_harvest: '2026-09-15',
      status: 'Growing',
      trust_score: 96
    },
    pre_cultivation: {
      soil_test_status: 'Passed',
      heavy_metal_status: 'Passed',
      water_quality: 'Excellent (Groundwater Well #2)',
      seed_provenance: 'Certified Non-GMO Heritage Nursery',
      buffer_zone_check: 'Passed (50m boundary)'
    },
    harvest_qa: {
      harvest_date: null,
      total_yield: 'Pending',
      marketable_yield: 'Pending',
      qa_status: 'Pending',
      residue_free: true,
      quality_notes: 'Crop is currently growing. Soil moisture is within target range.'
    },
    transit_retail: {
      pre_cooling_status: 'Pending',
      dispatch_date: null,
      transport_status: 'Pending Harvest',
      retail_handover: 'Pending',
      delivery_status: 'In Fields'
    },
    cultivation_logs: [
      {
        activity_type: 'Batch Created',
        description: 'Organic Honeycrisp Apples batch initialized in Section 4B.',
        timestamp: '2026-04-10T08:30:00Z',
        hash: '0x3a92fd1b22e741c889a7c062db0e5c94285b73e5bf4cd18d9a6c91ecb2a4771b'
      },
      {
        activity_type: 'Irrigation Logged',
        description: 'Natural Groundwater Well #2, Volume: 1200L, Soil Moisture Post: 52%',
        timestamp: '2026-05-01T10:15:00Z',
        hash: '0x8b54e7d4a9cfb058c49e29a95bc6e91ec088a8d1bb4c9e7a771bcfa9e7542d62'
      },
      {
        activity_type: 'Fertilizer Application',
        description: 'BioGrow Organic Nutrients, 25kg, Soil Drenching.',
        timestamp: '2026-06-02T14:40:00Z',
        hash: '0x2c98d7fa28b5849e7b29a8f6e7c91eb44d85a3c9bb4c9e2b17fbc8d6542a17cb'
      }
    ]
  },
  {
    batch_overview: {
      batch_id: 'FB-2026-002',
      crop_name: 'Japanese Sweet Potatoes',
      crop_image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=800&q=80',
      farm_name: 'Green Valley Organic Farm',
      farm_location: 'Hillside Terrace A, Green Valley Organic Farm, CA',
      cultivation_type: 'Raised Bed Micro-Sprinkler',
      sowing_date: '2026-03-05',
      expected_harvest: '2026-07-20',
      status: 'In Quality Check',
      trust_score: 94
    },
    pre_cultivation: {
      soil_test_status: 'Passed',
      heavy_metal_status: 'Passed',
      water_quality: 'Good (Micro-sprinkler filtration)',
      seed_provenance: 'Miyazaki Prefecture Organic Rootstock',
      buffer_zone_check: 'Passed'
    },
    harvest_qa: {
      harvest_date: '2026-06-11',
      total_yield: '850 kg',
      marketable_yield: '820 kg',
      qa_status: 'In Lab Audit',
      residue_free: true,
      quality_notes: 'Excellent size and color uniformity. High mineral soil content benefits.'
    },
    transit_retail: {
      pre_cooling_status: 'Completed',
      dispatch_date: null,
      transport_status: 'Pending Dispatch',
      retail_handover: 'Silo C Storage',
      delivery_status: 'At Farm'
    },
    cultivation_logs: [
      {
        activity_type: 'Batch Created',
        description: 'Japanese Sweet Potatoes batch initialized in Hillside Terrace A.',
        timestamp: '2026-03-05T09:00:00Z',
        hash: '0x41f89bc728a5bc9006fe9b50ce711bc7a2a4b89e27c1bfd65c4efcda87a4de8b'
      },
      {
        activity_type: 'Crop Harvested',
        description: 'Crop harvested: 850kg, Clear & Sunny weather, storage location: Silo C.',
        timestamp: '2026-06-11T16:00:00Z',
        hash: '0x9d5b73e5bf4cd18d9a6c91ecb2a4771bc84efc78b4f7e2a9b3d4f5c6b7a8d9e2'
      }
    ]
  },
  {
    batch_overview: {
      batch_id: 'FB-2026-003',
      crop_name: 'Premium Arabica Coffee',
      crop_image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
      farm_name: 'Coffee Haven',
      farm_location: 'Highland Ridge Zone 2, Coffee Haven, HI',
      cultivation_type: 'Shade-Grown Canopy',
      sowing_date: '2025-11-20',
      expected_harvest: '2026-06-05',
      status: 'QA Approved',
      trust_score: 98
    },
    pre_cultivation: {
      soil_test_status: 'Passed',
      heavy_metal_status: 'Passed',
      water_quality: 'Pure Rainwater & Natural Runoff',
      seed_provenance: 'Kona Estate Selection',
      buffer_zone_check: 'Passed'
    },
    harvest_qa: {
      harvest_date: '2026-06-03',
      total_yield: '420 kg',
      marketable_yield: '412 kg',
      qa_status: 'Approved (Grade 1 Specialty)',
      residue_free: true,
      quality_notes: 'Moisture level 10.5%. Cherry quality score AA Premium.'
    },
    transit_retail: {
      pre_cooling_status: 'Completed',
      dispatch_date: '2026-06-05',
      transport_status: 'In Transit (Refrigerated Sea Container)',
      retail_handover: 'Specialty Roasters Corp, NY',
      delivery_status: 'Delivered'
    },
    cultivation_logs: [
      {
        activity_type: 'Batch Created',
        description: 'Arabica Coffee batch initialized in Highland Ridge Zone 2.',
        timestamp: '2025-11-20T07:15:00Z',
        hash: '0x5c4efcda87a4de8bf89bc728a5bc9006fe9b50ce711bc7a2a4b89e27c1bfd65c'
      },
      {
        activity_type: 'Crop Harvested',
        description: 'Crop harvested: 420kg, cherry quality: AA Premium, storage: Climate-controlled Vault B.',
        timestamp: '2026-06-03T11:00:00Z',
        hash: '0x7e2a9b3d4f5c6b7a8d9e29d5b73e5bf4cd18d9a6c91ecb2a4771bc84efc78b4f'
      },
      {
        activity_type: 'QA Inspected',
        description: 'Moisture level: 10.5%, chemical residue compliance: Passed.',
        timestamp: '2026-06-04T10:00:00Z',
        hash: '0x3c9bb4c9e2b17fbc8d6542a17cb2c98d7fa28b5849e7b29a8f6e7c91eb44d85a'
      },
      {
        activity_type: 'QA Approved',
        description: 'Specialty Grade 1 Certified, Cert ID: CERT-HAWAII-448.',
        timestamp: '2026-06-05T09:30:00Z',
        hash: '0xba8efc78b4f7e2a9b3d4f5c6b7a8d9e29d5b73e5bf4cd18d9a6c91ecb2a4771b'
      }
    ]
  }
];

export async function initDb(shouldDrop = false) {
  if (isMysql) {
    console.log('Initializing MySQL Tables...');
    try {
      // 1. Drop existing tables if requested
      if (shouldDrop) {
        console.log('Dropping existing tables...');
        await pool.query('DROP TABLE IF EXISTS transactions');
        await pool.query('DROP TABLE IF EXISTS crop_cycles');
        await pool.query('DROP TABLE IF EXISTS credit_contacts');
        await pool.query('DROP TABLE IF EXISTS kcc_accounts');
        await pool.query('DROP TABLE IF EXISTS voice_logs');
        await pool.query('DROP TABLE IF EXISTS ai_chat_history');
        await pool.query('DROP TABLE IF EXISTS verification_logs');
        await pool.query('DROP TABLE IF EXISTS immudb_ledger');
        await pool.query('DROP TABLE IF EXISTS transit_retail');
        await pool.query('DROP TABLE IF EXISTS harvest_qa');
        await pool.query('DROP TABLE IF EXISTS cultivation_logs');
        await pool.query('DROP TABLE IF EXISTS pre_cultivation');
        await pool.query('DROP TABLE IF EXISTS batch_overview');
        await pool.query('DROP TABLE IF EXISTS farmers');
        await pool.query('DROP TABLE IF EXISTS admins');
        await pool.query('DROP TABLE IF EXISTS batch_events');
        await pool.query('DROP TABLE IF EXISTS labour_accounts');
      }

      // 2. Create tables
      await pool.query(`
        CREATE TABLE IF NOT EXISTS farmers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          farmer_id VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(100),
          email VARCHAR(100) UNIQUE,
          password_hash VARCHAR(255),
          is_registered BOOLEAN DEFAULT FALSE,
          login_count INT DEFAULT 0,
          trust_score INT DEFAULT 100,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id INT AUTO_INCREMENT PRIMARY KEY,
          admin_id VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          department VARCHAR(100) DEFAULT 'Quality Assurance & Trust',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS batch_events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          batch_id VARCHAR(50) NOT NULL,
          farmer_id VARCHAR(50) NOT NULL,
          event_type VARCHAR(100) NOT NULL,
          event_title VARCHAR(255) NOT NULL,
          event_description TEXT,
          event_status VARCHAR(50),
          trust_score_impact DECIMAL(4,2) DEFAULT 0.00,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS immudb_ledger (
          batch_id VARCHAR(50) PRIMARY KEY,
          blockchain_hash VARCHAR(66) NOT NULL
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS batch_overview (
          id INT AUTO_INCREMENT PRIMARY KEY,
          batch_id VARCHAR(50) UNIQUE NOT NULL,
          crop_name VARCHAR(100) NOT NULL,
          crop_image TEXT,
          farm_name VARCHAR(100) NOT NULL,
          farm_location VARCHAR(255) NOT NULL,
          cultivation_type VARCHAR(50) NOT NULL,
          sowing_date DATE NOT NULL,
          expected_harvest DATE,
          status VARCHAR(50) NOT NULL,
          blockchain_hash VARCHAR(66) NOT NULL,
          trust_score INT NOT NULL,
          total_points INT DEFAULT 0,
          current_level VARCHAR(50) DEFAULT 'Seedling',
          earned_badges TEXT,
          unlocked_rewards TEXT,
          activity_streak INT DEFAULT 1,
          last_activity_date VARCHAR(50) DEFAULT NULL,
          progress_percentage INT DEFAULT 0,
          farmer_id VARCHAR(50) DEFAULT 'FMR-0921',
          farmer_name VARCHAR(100) DEFAULT 'John Doe'
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS pre_cultivation (
          id INT AUTO_INCREMENT PRIMARY KEY,
          batch_id VARCHAR(50) NOT NULL,
          soil_test_status VARCHAR(50) NOT NULL,
          heavy_metal_status VARCHAR(50) NOT NULL,
          water_quality VARCHAR(50) NOT NULL,
          seed_provenance VARCHAR(100) NOT NULL,
          buffer_zone_check VARCHAR(50) NOT NULL,
          FOREIGN KEY (batch_id) REFERENCES batch_overview(batch_id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS cultivation_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          batch_id VARCHAR(50) NOT NULL,
          activity_type VARCHAR(100) NOT NULL,
          description TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          hash VARCHAR(66) NOT NULL,
          FOREIGN KEY (batch_id) REFERENCES batch_overview(batch_id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS harvest_qa (
          id INT AUTO_INCREMENT PRIMARY KEY,
          batch_id VARCHAR(50) NOT NULL,
          harvest_date DATE,
          total_yield VARCHAR(50) NOT NULL,
          marketable_yield VARCHAR(50) NOT NULL,
          qa_status VARCHAR(50) NOT NULL,
          residue_free BOOLEAN DEFAULT TRUE,
          quality_notes TEXT,
          FOREIGN KEY (batch_id) REFERENCES batch_overview(batch_id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS transit_retail (
          id INT AUTO_INCREMENT PRIMARY KEY,
          batch_id VARCHAR(50) NOT NULL,
          pre_cooling_status VARCHAR(50) NOT NULL,
          dispatch_date DATE,
          transport_status VARCHAR(100) NOT NULL,
          retail_handover VARCHAR(100) NOT NULL,
          delivery_status VARCHAR(50) NOT NULL,
          FOREIGN KEY (batch_id) REFERENCES batch_overview(batch_id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS verification_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          batch_id VARCHAR(50) NOT NULL,
          original_hash VARCHAR(66) NOT NULL,
          current_hash VARCHAR(66) NOT NULL,
          verification_status VARCHAR(50) NOT NULL,
          detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (batch_id) REFERENCES batch_overview(batch_id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_chat_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          farmer_id VARCHAR(50),
          input_type VARCHAR(20) NOT NULL,
          image_url TEXT,
          user_query TEXT NOT NULL,
          ai_response TEXT,
          detected_issue VARCHAR(255),
          confidence_score DECIMAL(5,2),
          recommendations TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS voice_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          farmer_id VARCHAR(50),
          raw_voice_text TEXT NOT NULL,
          parsed_action VARCHAR(255),
          target_table VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS labour_accounts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          batch_id VARCHAR(50) NOT NULL,
          date DATE NOT NULL,
          total_labour INT NOT NULL,
          male INT NOT NULL,
          female INT NOT NULL,
          duration DECIMAL(5,2) NOT NULL,
          wage DECIMAL(10,2) NOT NULL,
          total_expense DECIMAL(12,2) NOT NULL,
          remarks TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (batch_id) REFERENCES batch_overview(batch_id) ON DELETE CASCADE
        )
      `);

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

      console.log('Tables created successfully.');
      
      // Seed predefined farmers in MySQL
      console.log('Skipping predefined farmer seeding (created dynamically).');
    } catch (err) {
      console.error('Error creating MySQL tables:', err);
      throw err;
    }
  } else {
    console.log('Skipping MySQL Table creation, running in JSON fallback mode.');
  }

  // Common seeding logic (both JSON and MySQL)
  console.log('Seeding initial data...');
  try {
    const initialLabourAccounts = [
      {
        batch_id: 'FB-2026-002',
        date: '2026-06-15',
        total_labour: 12,
        male: 7,
        female: 5,
        duration: 8.0,
        wage: 15.0,
        total_expense: 1440.0,
        remarks: 'Sowing sweet potatoes in terrace A.'
      },
      {
        batch_id: 'FB-2026-001',
        date: '2026-06-20',
        total_labour: 8,
        male: 4,
        female: 4,
        duration: 6.0,
        wage: 16.5,
        total_expense: 792.0,
        remarks: 'Watering & weeding orchard Section 4B.'
      }
    ];

    const freshDb = {
      batch_overview: [],
      pre_cultivation: [],
      cultivation_logs: [],
      harvest_qa: [],
      transit_retail: [],
      verification_logs: [],
      ai_chat_history: [],
      voice_logs: [],
      batch_events: [],
      farmers: [],
      admins: [],
      labour_accounts: initialLabourAccounts
    };
    
    // Save fresh JSON template first if in fallback mode
    if (!isMysql) {
      await dbService.saveBackup(freshDb);
    }

    for (const data of initialBatchesData) {
      // 1. Calculate blockchain hash dynamically for this batch
      const fullBatchState = {
        ...data.batch_overview,
        ...data.pre_cultivation,
        ...data.harvest_qa,
        ...data.transit_retail
      };
      const initialHash = calculateBatchHash(fullBatchState);
      data.batch_overview.blockchain_hash = initialHash;

      // 2. Insert via dbService
      await dbService.createBatch(data);
      console.log(`Seeded batch ${data.batch_overview.batch_id} with hash ${initialHash}`);
    }

    if (isMysql) {
      console.log('Seeding labour accounts in MySQL...');
      for (const entry of initialLabourAccounts) {
        await pool.query(
          'INSERT INTO labour_accounts (batch_id, date, total_labour, male, female, duration, wage, total_expense, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [entry.batch_id, entry.date, entry.total_labour, entry.male, entry.female, entry.duration, entry.wage, entry.total_expense, entry.remarks]
        );
      }
    }
    console.log('Database initialization completed successfully.');
  } catch (err) {
    console.error('Error seeding data:', err);
    throw err;
  }
}

// Check if run directly
const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(__filename);

if (isMain) {
  initDb(true).then(() => {
    if (isMysql) process.exit(0);
  }).catch((err) => {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  });
}
