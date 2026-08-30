import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { pool, isMysql } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonDbPath = path.join(__dirname, 'database.json');

// Helper to get next numeric ID for JSON database tables
function getNextId(list) {
  if (!list || !Array.isArray(list)) return 1;
  const numericIds = list
    .map(x => parseInt(x.id, 10))
    .filter(id => !isNaN(id) && isFinite(id));
  return numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
}

// Helper to calculate SHA-256 hash from live database fields
export function calculateBatchHash(batch) {
  const formatDate = (val) => {
    if (!val) return '';
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    if (typeof val === 'string') {
      return val.split('T')[0];
    }
    return String(val);
  };

  const getVal = (field, section) => {
    if (batch[field] !== undefined) return batch[field];
    if (section && batch[section] && batch[section][field] !== undefined) {
      return batch[section][field];
    }
    return '';
  };

  const parts = [
    // batch_overview fields
    batch.batch_id || '',
    batch.crop_name || batch.cropType || '',
    batch.farm_name || '',
    batch.farm_location || '',
    batch.cultivation_type || '',
    formatDate(batch.sowing_date || batch.seedDate),
    formatDate(batch.expected_harvest || batch.expectedHarvestDate),
    batch.status || '',
    String(batch.trust_score || batch.trustScore || '100'),
    
    // pre_cultivation fields
    getVal('soil_test_status', 'pre_cultivation'),
    getVal('heavy_metal_status', 'pre_cultivation'),
    getVal('water_quality', 'pre_cultivation'),
    getVal('seed_provenance', 'pre_cultivation'),
    getVal('buffer_zone_check', 'pre_cultivation'),
    
    // harvest_qa fields
    formatDate(getVal('harvest_date', 'harvest_qa')),
    getVal('total_yield', 'harvest_qa'),
    getVal('marketable_yield', 'harvest_qa'),
    getVal('qa_status', 'harvest_qa'),
    getVal('residue_free', 'harvest_qa') ? '1' : '0',
    getVal('quality_notes', 'harvest_qa') || '',
    
    // transit_retail fields
    getVal('pre_cooling_status', 'transit_retail'),
    formatDate(getVal('dispatch_date', 'transit_retail')),
    getVal('transport_status', 'transit_retail'),
    getVal('retail_handover', 'transit_retail'),
    getVal('delivery_status', 'transit_retail')
  ];

  const dataString = parts.join('|');
  return '0x' + crypto.createHash('sha256').update(dataString).digest('hex');
}

// Read JSON fallback database
function readJsonDb() {
  if (!fs.existsSync(jsonDbPath)) {
    return {
      batch_overview: [],
      pre_cultivation: [],
      cultivation_logs: [],
      harvest_qa: [],
      transit_retail: [],
      verification_logs: []
    };
  }
  return JSON.parse(fs.readFileSync(jsonDbPath, 'utf8'));
}

// Write JSON fallback database
function writeJsonDb(data) {
  fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2), 'utf8');
}

// Real VPS immudb connection details and helper
const IMMUDB_HOST = process.env.IMMUDB_HOST || '161.97.122.156';
const IMMUDB_PORT = process.env.IMMUDB_PORT || '8081';
const IMMUDB_USER = process.env.IMMUDB_USER || 'farmbuddyapp1';
const IMMUDB_PASSWORD = process.env.IMMUDB_PASSWORD || 'FarmBuddy2026#1';
const IMMUDB_DB = process.env.IMMUDB_DB || 'defaultdb';

async function executeImmudbAction(actionFn) {
  let sessionID = null;
  try {
    const res = await fetch(`http://${IMMUDB_HOST}:${IMMUDB_PORT}/api/v2/authorization/session/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: IMMUDB_USER,
        password: IMMUDB_PASSWORD,
        database: IMMUDB_DB
      }),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      sessionID = data.sessionID;
    }
  } catch (err) {
    console.warn('Failed to open session on VPS immudb:', err.message);
  }

  if (!sessionID) {
    return null;
  }

  try {
    const result = await actionFn(sessionID);
    return result;
  } catch (err) {
    console.error('Error executing immudb action:', err.message);
    return null;
  } finally {
    try {
      await fetch(`http://${IMMUDB_HOST}:${IMMUDB_PORT}/api/v2/authorization/session/close`, {
        method: 'POST',
        headers: { 'sessionID': sessionID },
        signal: AbortSignal.timeout(2000)
      });
    } catch (err) {
      // Ignore session close error
    }
  }
}

export function parseBatchGamification(overview) {
  if (!overview) return overview;
  const copy = { ...overview };
  if (typeof copy.earned_badges === 'string') {
    try {
      copy.earned_badges = JSON.parse(copy.earned_badges);
    } catch(e) {
      copy.earned_badges = copy.earned_badges ? copy.earned_badges.split(',') : [];
    }
  }
  if (typeof copy.unlocked_rewards === 'string') {
    try {
      copy.unlocked_rewards = JSON.parse(copy.unlocked_rewards);
    } catch(e) {
      copy.unlocked_rewards = copy.unlocked_rewards ? copy.unlocked_rewards.split(',') : [];
    }
  }
  // Ensure default values are populated if missing (defensive)
  if (copy.total_points === undefined) copy.total_points = 0;
  if (!copy.current_level) copy.current_level = 'Seedling';
  if (!copy.earned_badges) copy.earned_badges = [];
  if (!copy.unlocked_rewards) copy.unlocked_rewards = [];
  if (copy.activity_streak === undefined) copy.activity_streak = 1;
  if (copy.progress_percentage === undefined) copy.progress_percentage = 0;
  return copy;
}

export const dbService = {
  // immudb simulated ledger operations with VPS primary connection
  async storeImmudbHash(batch_id, hash) {
    // 1. Save to local simulated immudb ledger (backup fallback)
    if (isMysql) {
      try {
        await pool.query(
          'INSERT INTO immudb_ledger (batch_id, blockchain_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE blockchain_hash = ?',
          [batch_id, hash, hash]
        );
      } catch (err) {
        console.error('Local immudb fallback save failed:', err.message);
      }
    } else {
      const db = readJsonDb();
      if (!db.immudb_ledger) db.immudb_ledger = [];
      const existing = db.immudb_ledger.find(item => item.batch_id === batch_id);
      if (existing) {
        existing.blockchain_hash = hash;
      } else {
        db.immudb_ledger.push({ batch_id, blockchain_hash: hash });
      }
      writeJsonDb(db);
    }

    // 2. Try saving to the real VPS immudb SQL table
    await executeImmudbAction(async (sessionID) => {
      // Create table if not exists first
      await fetch(`http://${IMMUDB_HOST}:${IMMUDB_PORT}/api/db/sqlexec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'sessionID': sessionID },
        body: JSON.stringify({
          sql: 'CREATE TABLE IF NOT EXISTS immudb_ledger (batch_id VARCHAR(50), blockchain_hash VARCHAR(256), PRIMARY KEY(batch_id));'
        }),
        signal: AbortSignal.timeout(4000)
      });

      // Upsert the crop details and hash
      const res = await fetch(`http://${IMMUDB_HOST}:${IMMUDB_PORT}/api/db/sqlexec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'sessionID': sessionID
        },
        body: JSON.stringify({
          sql: `UPSERT INTO immudb_ledger (batch_id, blockchain_hash) VALUES ('${batch_id}', '${hash}');`
        }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        console.log(`Successfully committed hash for batch ${batch_id} to VPS immudb SQL table.`);
      } else {
        const errText = await res.text();
        console.warn(`Failed to commit to VPS immudb SQL table: ${res.status} ${errText}`);
      }
    });
  },

  async getImmudbHash(batch_id) {
    // 1. Try fetching from the real VPS immudb SQL table first
    const vpsHash = await executeImmudbAction(async (sessionID) => {
      // Create table if not exists first (defensive check)
      await fetch(`http://${IMMUDB_HOST}:${IMMUDB_PORT}/api/db/sqlexec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'sessionID': sessionID },
        body: JSON.stringify({
          sql: 'CREATE TABLE IF NOT EXISTS immudb_ledger (batch_id VARCHAR(50), blockchain_hash VARCHAR(256), PRIMARY KEY(batch_id));'
        }),
        signal: AbortSignal.timeout(4000)
      });

      const res = await fetch(`http://${IMMUDB_HOST}:${IMMUDB_PORT}/api/db/sqlquery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'sessionID': sessionID
        },
        body: JSON.stringify({
          sql: `SELECT blockchain_hash FROM immudb_ledger WHERE batch_id = '${batch_id}' LIMIT 1;`
        }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.rows && data.rows.length > 0 && data.rows[0].values && data.rows[0].values.length > 0) {
          const hash = data.rows[0].values[0].s;
          console.log(`Successfully retrieved hash for batch ${batch_id} from VPS immudb SQL table: ${hash}`);
          return hash;
        }
      }
      return null;
    });

    if (vpsHash) {
      return vpsHash;
    }

    // 2. Fallback to local simulated ledger if VPS fails
    console.log(`Falling back to local immudb simulation for batch ${batch_id}`);
    if (isMysql) {
      const [rows] = await pool.query('SELECT blockchain_hash FROM immudb_ledger WHERE batch_id = ?', [batch_id]);
      return rows.length > 0 ? rows[0].blockchain_hash : null;
    } else {
      const db = readJsonDb();
      if (!db.immudb_ledger) db.immudb_ledger = [];
      const item = db.immudb_ledger.find(item => item.batch_id === batch_id);
      return item ? item.blockchain_hash : null;
    }
  },

  async updateBatchHashAndLedger(batch_id) {
    const details = await this.getBatchDetails(batch_id);
    if (!details) return null;
    const newHash = calculateBatchHash(details);
    
    // Update immudb
    await this.storeImmudbHash(batch_id, newHash);
    
    // Update MySQL or JSON overview
    if (isMysql) {
      await pool.query('UPDATE batch_overview SET blockchain_hash = ? WHERE batch_id = ?', [newHash, batch_id]);
    } else {
      const db = readJsonDb();
      const overview = db.batch_overview.find(b => b.batch_id === batch_id);
      if (overview) {
        overview.blockchain_hash = newHash;
        writeJsonDb(db);
      }
    }
    return newHash;
  },

  // Get all batches overview
  async getAllBatches() {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM batch_overview ORDER BY sowing_date DESC');
      return rows.map(parseBatchGamification);
    } else {
      const db = readJsonDb();
      return (db.batch_overview || []).map(parseBatchGamification);
    }
  },

  // Get full combined details of a batch
  async getBatchDetails(batch_id) {
    if (isMysql) {
      const [overviews] = await pool.query('SELECT * FROM batch_overview WHERE batch_id = ?', [batch_id]);
      if (overviews.length === 0) return null;
      const overview = parseBatchGamification(overviews[0]);

      const [preCultivations] = await pool.query('SELECT * FROM pre_cultivation WHERE batch_id = ?', [batch_id]);
      const [harvestQAs] = await pool.query('SELECT * FROM harvest_qa WHERE batch_id = ?', [batch_id]);
      const [transitRetails] = await pool.query('SELECT * FROM transit_retail WHERE batch_id = ?', [batch_id]);
      const [cultivationLogs] = await pool.query('SELECT * FROM cultivation_logs WHERE batch_id = ? ORDER BY timestamp ASC', [batch_id]);
      const [verificationLogs] = await pool.query('SELECT * FROM verification_logs WHERE batch_id = ? ORDER BY detected_at DESC', [batch_id]);

      return {
        ...overview,
        pre_cultivation: preCultivations[0] || null,
        harvest_qa: harvestQAs[0] || null,
        transit_retail: transitRetails[0] || null,
        cultivation_logs: cultivationLogs,
        verification_logs: verificationLogs
      };
    } else {
      const db = readJsonDb();
      const rawOverview = db.batch_overview.find(b => b.batch_id === batch_id);
      if (!rawOverview) return null;
      const overview = parseBatchGamification(rawOverview);

      const pre_cult = db.pre_cultivation.find(b => b.batch_id === batch_id) || null;
      const harvest = db.harvest_qa.find(b => b.batch_id === batch_id) || null;
      const transit = db.transit_retail.find(b => b.batch_id === batch_id) || null;
      const logs = db.cultivation_logs.filter(b => b.batch_id === batch_id) || [];
      const vlogs = db.verification_logs.filter(b => b.batch_id === batch_id) || [];

      return {
        ...overview,
        pre_cultivation: pre_cult,
        harvest_qa: harvest,
        transit_retail: transit,
        cultivation_logs: logs,
        verification_logs: vlogs
      };
    }
  },

  // Add a verification log record
  async addVerificationLog(batch_id, original_hash, current_hash, verification_status) {
    if (isMysql) {
      await pool.query(
        'INSERT INTO verification_logs (batch_id, original_hash, current_hash, verification_status) VALUES (?, ?, ?, ?)',
        [batch_id, original_hash, current_hash, verification_status]
      );
    } else {
      const db = readJsonDb();
      const newLog = {
        id: db.verification_logs.length + 1,
        batch_id,
        original_hash,
        current_hash,
        verification_status,
        detected_at: new Date().toISOString()
      };
      db.verification_logs.push(newLog);
      writeJsonDb(db);
    }
  },

  // Tamper a database record to trigger hash mismatch
  async tamperBatch(batch_id) {
    if (isMysql) {
      // Check if harvest_qa exists
      const [rows] = await pool.query('SELECT * FROM harvest_qa WHERE batch_id = ?', [batch_id]);
      if (rows.length > 0) {
        // Change marketable_yield in harvest_qa to simulate tampering
        await pool.query(
          "UPDATE harvest_qa SET marketable_yield = '1200 kg (Tampered)' WHERE batch_id = ?",
          [batch_id]
        );
      } else {
        // Fallback: update pre_cultivation
        await pool.query(
          "UPDATE pre_cultivation SET soil_test_status = 'Failed (Tampered)' WHERE batch_id = ?",
          [batch_id]
        );
      }
    } else {
      const db = readJsonDb();
      const harvest = db.harvest_qa.find(b => b.batch_id === batch_id);
      if (harvest) {
        harvest.marketable_yield = '1200 kg (Tampered)';
      } else {
        const pre_cult = db.pre_cultivation.find(b => b.batch_id === batch_id);
        if (pre_cult) {
          pre_cult.soil_test_status = 'Failed (Tampered)';
        }
      }
      writeJsonDb(db);
    }
  },

  // Restore database integrity by undoing tampering simulation
  async restoreBatch(batch_id) {
    let originalYield = 'Pending';
    if (batch_id === 'FB-2026-002') originalYield = '820 kg';
    if (batch_id === 'FB-2026-003') originalYield = '412 kg';

    if (isMysql) {
      await pool.query(
        "UPDATE harvest_qa SET marketable_yield = ? WHERE batch_id = ?",
        [originalYield, batch_id]
      );
      await pool.query(
        "UPDATE pre_cultivation SET soil_test_status = 'Passed' WHERE batch_id = ?",
        [batch_id]
      );
    } else {
      const db = readJsonDb();
      const harvest = db.harvest_qa.find(b => b.batch_id === batch_id);
      if (harvest) {
        harvest.marketable_yield = originalYield;
      }
      const pre_cult = db.pre_cultivation.find(b => b.batch_id === batch_id);
      if (pre_cult) {
        pre_cult.soil_test_status = 'Passed';
      }
      writeJsonDb(db);
    }
  },

  // Save a brand new batch
  async createBatch(batchData) {
    const {
      batch_overview,
      pre_cultivation,
      harvest_qa,
      transit_retail,
      cultivation_logs
    } = batchData;

    if (isMysql) {
      // 1. Insert overview
      await pool.query(
        `INSERT INTO batch_overview (
          batch_id, crop_name, crop_image, farm_name, farm_location, 
          cultivation_type, sowing_date, expected_harvest, status, 
          blockchain_hash, trust_score, total_points, current_level, 
          earned_badges, unlocked_rewards, activity_streak, last_activity_date, 
          progress_percentage, farmer_id, farmer_name
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          batch_overview.batch_id,
          batch_overview.crop_name,
          batch_overview.crop_image,
          batch_overview.farm_name,
          batch_overview.farm_location,
          batch_overview.cultivation_type,
          batch_overview.sowing_date,
          batch_overview.expected_harvest,
          batch_overview.status,
          batch_overview.blockchain_hash,
          batch_overview.trust_score,
          batch_overview.total_points || 0,
          batch_overview.current_level || 'Seedling',
          Array.isArray(batch_overview.earned_badges) ? JSON.stringify(batch_overview.earned_badges) : (batch_overview.earned_badges || '[]'),
          Array.isArray(batch_overview.unlocked_rewards) ? JSON.stringify(batch_overview.unlocked_rewards) : (batch_overview.unlocked_rewards || '[]'),
          batch_overview.activity_streak || 1,
          batch_overview.last_activity_date || null,
          batch_overview.progress_percentage || 0,
          batch_overview.farmer_id || 'FMR-0921',
          batch_overview.farmer_name || 'John Doe'
        ]
      );

      // 2. Insert pre_cultivation
      await pool.query(
        `INSERT INTO pre_cultivation (batch_id, soil_test_status, heavy_metal_status, water_quality, seed_provenance, buffer_zone_check)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          batch_overview.batch_id,
          pre_cultivation.soil_test_status,
          pre_cultivation.heavy_metal_status,
          pre_cultivation.water_quality,
          pre_cultivation.seed_provenance,
          pre_cultivation.buffer_zone_check
        ]
      );

      // 3. Insert harvest_qa
      await pool.query(
        `INSERT INTO harvest_qa (batch_id, harvest_date, total_yield, marketable_yield, qa_status, residue_free, quality_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          batch_overview.batch_id,
          harvest_qa.harvest_date,
          harvest_qa.total_yield,
          harvest_qa.marketable_yield,
          harvest_qa.qa_status,
          harvest_qa.residue_free,
          harvest_qa.quality_notes
        ]
      );

      // 4. Insert transit_retail
      await pool.query(
        `INSERT INTO transit_retail (batch_id, pre_cooling_status, dispatch_date, transport_status, retail_handover, delivery_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          batch_overview.batch_id,
          transit_retail.pre_cooling_status,
          transit_retail.dispatch_date,
          transit_retail.transport_status,
          transit_retail.retail_handover,
          transit_retail.delivery_status
        ]
      );

      // 5. Insert cultivation logs
      for (const log of cultivation_logs) {
        await pool.query(
          `INSERT INTO cultivation_logs (batch_id, activity_type, description, timestamp, hash)
           VALUES (?, ?, ?, ?, ?)`,
          [
            batch_overview.batch_id,
            log.activity_type,
            log.description,
            log.timestamp || new Date(),
            log.hash || '0xhash'
          ]
        );
      }
    } else {
      const db = readJsonDb();
      
      db.batch_overview.push(batch_overview);
      db.pre_cultivation.push({
        id: db.pre_cultivation.length + 1,
        ...pre_cultivation,
        batch_id: batch_overview.batch_id
      });
      db.harvest_qa.push({
        id: db.harvest_qa.length + 1,
        ...harvest_qa,
        batch_id: batch_overview.batch_id
      });
      db.transit_retail.push({
        id: db.transit_retail.length + 1,
        ...transit_retail,
        batch_id: batch_overview.batch_id
      });
      
      cultivation_logs.forEach((log, index) => {
        db.cultivation_logs.push({
          id: db.cultivation_logs.length + 1,
          batch_id: batch_overview.batch_id,
          activity_type: log.activity_type,
          description: log.description,
          timestamp: log.timestamp || new Date().toISOString(),
          hash: log.hash || '0xhash'
        });
      });

      writeJsonDb(db);
    }

    // Store hash in immudb ledger
    await this.storeImmudbHash(batch_overview.batch_id, batch_overview.blockchain_hash);
  },

  // Save AI chat history record
  async saveAiChat(chatData) {
    const {
      farmer_id,
      input_type,
      image_url,
      user_query,
      ai_response,
      detected_issue,
      confidence_score,
      recommendations
    } = chatData;

    if (isMysql) {
      const [result] = await pool.query(
        `INSERT INTO ai_chat_history (farmer_id, input_type, image_url, user_query, ai_response, detected_issue, confidence_score, recommendations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          farmer_id || null,
          input_type,
          image_url || null,
          user_query,
          ai_response || null,
          detected_issue || null,
          confidence_score || null,
          recommendations || null
        ]
      );
      return { id: result.insertId, ...chatData, created_at: new Date().toISOString() };
    } else {
      const db = readJsonDb();
      const newChat = {
        id: db.ai_chat_history.length + 1,
        farmer_id: farmer_id || null,
        input_type,
        image_url: image_url || null,
        user_query,
        ai_response: ai_response || null,
        detected_issue: detected_issue || null,
        confidence_score: confidence_score || null,
        recommendations: recommendations || null,
        created_at: new Date().toISOString()
      };
      db.ai_chat_history.push(newChat);
      writeJsonDb(db);
      return newChat;
    }
  },

  // Save voice command logs
  async saveVoiceLog(logData) {
    const { farmer_id, raw_voice_text, parsed_action, target_table } = logData;

    if (isMysql) {
      const [result] = await pool.query(
        `INSERT INTO voice_logs (farmer_id, raw_voice_text, parsed_action, target_table)
         VALUES (?, ?, ?, ?)`,
        [
          farmer_id || null,
          raw_voice_text,
          parsed_action || null,
          target_table || null
        ]
      );
      return { id: result.insertId, ...logData, created_at: new Date().toISOString() };
    } else {
      const db = readJsonDb();
      const newLog = {
        id: db.voice_logs.length + 1,
        farmer_id: farmer_id || null,
        raw_voice_text,
        parsed_action: parsed_action || null,
        target_table: target_table || null,
        created_at: new Date().toISOString()
      };
      db.voice_logs.push(newLog);
      writeJsonDb(db);
      return newLog;
    }
  },

  // Get AI history lists
  async getAiHistory(farmer_id) {
    if (isMysql) {
      const [chats] = await pool.query(
        'SELECT * FROM ai_chat_history ORDER BY created_at DESC'
      );
      const [voice] = await pool.query(
        'SELECT * FROM voice_logs ORDER BY created_at DESC'
      );
      return { chats, voice };
    } else {
      const db = readJsonDb();
      const chats = [...(db.ai_chat_history || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const voice = [...(db.voice_logs || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { chats, voice };
    }
  },

  // Save database backup helper
  async saveBackup(dbData) {
    writeJsonDb(dbData);
  },

  // Save QR Code path for a batch
  async saveQrCode(batch_id, qr_code) {
    if (isMysql) {
      try {
        await pool.query(
          'UPDATE batch_overview SET qr_code = ? WHERE batch_id = ?',
          [qr_code, batch_id]
        );
      } catch (err) {
        if (err.code === 'ER_BAD_FIELD_ERROR') {
          await pool.query('ALTER TABLE batch_overview ADD COLUMN qr_code TEXT');
          await pool.query(
            'UPDATE batch_overview SET qr_code = ? WHERE batch_id = ?',
            [qr_code, batch_id]
          );
        } else {
          throw err;
        }
      }
    } else {
      const db = readJsonDb();
      const overview = db.batch_overview.find(b => b.batch_id === batch_id);
      if (overview) {
        overview.qr_code = qr_code;
        writeJsonDb(db);
      }
    }
  },

  // Get all reports
  async getAllReports() {
    if (isMysql) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            content LONGTEXT NOT NULL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        const [rows] = await pool.query('SELECT * FROM reports ORDER BY upload_date DESC');
        return rows.map(r => ({
          id: r.id,
          name: r.name,
          uploadDate: r.upload_date,
          type: r.type,
          content: r.content
        }));
      } catch (err) {
        console.error('MySQL reports query failed:', err);
        return [];
      }
    } else {
      const db = readJsonDb();
      return db.reports || [];
    }
  },

  // Save a report
  async saveReport(reportData) {
    const { name, type, content } = reportData;
    const uploadDate = new Date().toISOString();
    
    if (isMysql) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          content LONGTEXT NOT NULL,
          upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const [result] = await pool.query(
        'INSERT INTO reports (name, type, content) VALUES (?, ?, ?)',
        [name, type, content]
      );
      return {
        id: result.insertId,
        name,
        type,
        content,
        uploadDate
      };
    } else {
      const db = readJsonDb();
      if (!db.reports) db.reports = [];
      const newReport = {
        id: getNextId(db.reports),
        name,
        type,
        content,
        uploadDate
      };
      db.reports.push(newReport);
      writeJsonDb(db);
      return newReport;
    }
  },

  // Delete a report
  async deleteReport(id) {
    if (isMysql) {
      await pool.query('DELETE FROM reports WHERE id = ?', [id]);
      return true;
    } else {
      const db = readJsonDb();
      if (!db.reports) return false;
      const initialLength = db.reports.length;
      db.reports = db.reports.filter(r => r.id !== Number(id));
      if (db.reports.length < initialLength) {
        writeJsonDb(db);
        return true;
      }
    }
  },

  // Get farmer by ID
  async getFarmerById(farmer_id) {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM farmers WHERE farmer_id = ?', [farmer_id]);
      return rows[0] || null;
    } else {
      const db = readJsonDb();
      if (!db.farmers) db.farmers = [];
      return db.farmers.find(f => f.farmer_id === farmer_id) || null;
    }
  },

  // Get farmer by email
  async getFarmerByEmail(email) {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM farmers WHERE email = ?', [email]);
      return rows[0] || null;
    } else {
      const db = readJsonDb();
      if (!db.farmers) db.farmers = [];
      return db.farmers.find(f => f.email === email) || null;
    }
  },

  // Create a new farmer
  async createFarmer(farmerDataOrId) {
    let farmer_id, name = null, email = null, password_hash = null, is_registered = false, login_count = 1;
    if (typeof farmerDataOrId === 'object' && farmerDataOrId !== null) {
      farmer_id = farmerDataOrId.farmer_id;
      name = farmerDataOrId.name || null;
      email = farmerDataOrId.email || null;
      password_hash = farmerDataOrId.password_hash || null;
      is_registered = farmerDataOrId.is_registered !== undefined ? farmerDataOrId.is_registered : true;
      login_count = farmerDataOrId.login_count !== undefined ? farmerDataOrId.login_count : 1;
    } else {
      farmer_id = farmerDataOrId;
      is_registered = false;
      login_count = 1;
    }

    if (isMysql) {
      const [result] = await pool.query(
        'INSERT INTO farmers (farmer_id, name, email, password_hash, is_registered, login_count, trust_score) VALUES (?, ?, ?, ?, ?, ?, 100)',
        [farmer_id, name, email, password_hash, is_registered, login_count]
      );
      return {
        id: result.insertId,
        farmer_id,
        name,
        email,
        is_registered,
        login_count,
        trust_score: 100
      };
    } else {
      const db = readJsonDb();
      if (!db.farmers) db.farmers = [];
      const newFarmer = {
        id: getNextId(db.farmers),
        farmer_id,
        name,
        email,
        password_hash,
        is_registered,
        login_count,
        trust_score: 100,
        created_at: new Date().toISOString()
      };
      db.farmers.push(newFarmer);
      writeJsonDb(db);
      return newFarmer;
    }
  },

  // Update farmer profile (Complete registration)
  async updateFarmerProfile(farmer_id, profileData) {
    const { name, email, password_hash } = profileData;
    if (isMysql) {
      await pool.query(
        'UPDATE farmers SET name = ?, email = ?, password_hash = ?, is_registered = true WHERE farmer_id = ?',
        [name, email, password_hash, farmer_id]
      );
      return true;
    } else {
      const db = readJsonDb();
      if (!db.farmers) db.farmers = [];
      const farmer = db.farmers.find(f => f.farmer_id === farmer_id);
      if (farmer) {
        farmer.name = name;
        farmer.email = email;
        farmer.password_hash = password_hash;
        farmer.is_registered = true;
        writeJsonDb(db);
        return true;
      }
      return false;
    }
  },

  // Increment login count
  async incrementLoginCount(farmer_id) {
    if (isMysql) {
      await pool.query(
        'UPDATE farmers SET login_count = login_count + 1 WHERE farmer_id = ?',
        [farmer_id]
      );
      return true;
    } else {
      const db = readJsonDb();
      if (!db.farmers) db.farmers = [];
      const farmer = db.farmers.find(f => f.farmer_id === farmer_id);
      if (farmer) {
        farmer.login_count = (farmer.login_count || 0) + 1;
        writeJsonDb(db);
        return true;
      }
      return false;
    }
  },

  // Add batch event
  async addBatchEvent(eventData) {
    const { batch_id, farmer_id, event_type, event_title, event_description, event_status, trust_score_impact } = eventData;
    if (isMysql) {
      const [result] = await pool.query(
        `INSERT INTO batch_events (batch_id, farmer_id, event_type, event_title, event_description, event_status, trust_score_impact) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [batch_id, farmer_id, event_type, event_title, event_description, event_status, trust_score_impact]
      );
      return {
        id: result.insertId,
        ...eventData,
        created_at: new Date().toISOString()
      };
    } else {
      const db = readJsonDb();
      if (!db.batch_events) db.batch_events = [];
      const newEvent = {
        id: getNextId(db.batch_events),
        batch_id,
        farmer_id,
        event_type,
        event_title,
        event_description,
        event_status,
        trust_score_impact: parseFloat(trust_score_impact || 0),
        created_at: new Date().toISOString()
      };
      db.batch_events.push(newEvent);
      writeJsonDb(db);
      return newEvent;
    }
  },

  // Get batch events
  async getBatchEvents(batch_id) {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM batch_events WHERE batch_id = ? ORDER BY created_at DESC', [batch_id]);
      return rows;
    } else {
      const db = readJsonDb();
      if (!db.batch_events) db.batch_events = [];
      const events = db.batch_events.filter(e => e.batch_id === batch_id);
      events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return events;
    }
  },

  // Labour accounts CRUD methods
  async getAllLabourAccounts(farmer_id) {
    if (isMysql) {
      try {
        const [rows] = await pool.query('SELECT * FROM labour_accounts WHERE farmer_id = ? ORDER BY date DESC', [farmer_id]);
        return rows;
      } catch (err) {
        console.error('MySQL labour accounts query failed:', err);
        return [];
      }
    } else {
      const db = readJsonDb();
      const list = db.labour_accounts || [];
      return list.filter(item => item.farmer_id === farmer_id);
    }
  },

  async createLabourAccount(entry) {
    const { farmer_id, date, worker_name, gender, work_type, crop, plot, hours_worked, daily_wage, bonus, overtime, advance, payment_status, payment_mode, notes } = entry;
    const hours = parseFloat(hours_worked || 0);
    const wage = parseFloat(daily_wage || 0);
    const b = parseFloat(bonus || 0);
    const ot = parseFloat(overtime || 0);
    const adv = parseFloat(advance || 0);
    const total_amount = parseFloat(((hours * wage) + b + ot - adv).toFixed(2));

    if (isMysql) {
      const [result] = await pool.query(
        'INSERT INTO labour_accounts (farmer_id, date, worker_name, gender, work_type, crop, plot, hours_worked, daily_wage, bonus, overtime, advance, payment_status, payment_mode, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [farmer_id, date, worker_name, gender, work_type, crop, plot || null, hours, wage, b, ot, adv, payment_status, payment_mode, total_amount, notes || null]
      );
      return {
        id: result.insertId,
        ...entry,
        total_amount
      };
    } else {
      const db = readJsonDb();
      if (!db.labour_accounts) db.labour_accounts = [];
      const newEntry = {
        id: getNextId(db.labour_accounts),
        farmer_id,
        date,
        worker_name,
        gender,
        work_type,
        crop,
        plot: plot || null,
        hours_worked: hours,
        daily_wage: wage,
        bonus: b,
        overtime: ot,
        advance: adv,
        payment_status,
        payment_mode,
        total_amount,
        notes: notes || null,
        created_at: new Date().toISOString()
      };
      db.labour_accounts.push(newEntry);
      writeJsonDb(db);
      return newEntry;
    }
  },

  async updateLabourAccount(id, entry) {
    const { farmer_id, date, worker_name, gender, work_type, crop, plot, hours_worked, daily_wage, bonus, overtime, advance, payment_status, payment_mode, notes } = entry;
    const hours = parseFloat(hours_worked || 0);
    const wage = parseFloat(daily_wage || 0);
    const b = parseFloat(bonus || 0);
    const ot = parseFloat(overtime || 0);
    const adv = parseFloat(advance || 0);
    const total_amount = parseFloat(((hours * wage) + b + ot - adv).toFixed(2));

    if (isMysql) {
      await pool.query(
        'UPDATE labour_accounts SET date = ?, worker_name = ?, gender = ?, work_type = ?, crop = ?, plot = ?, hours_worked = ?, daily_wage = ?, bonus = ?, overtime = ?, advance = ?, payment_status = ?, payment_mode = ?, total_amount = ?, notes = ? WHERE id = ?',
        [date, worker_name, gender, work_type, crop, plot || null, hours, wage, b, ot, adv, payment_status, payment_mode, total_amount, notes || null, id]
      );
      return { id, ...entry, total_amount };
    } else {
      const db = readJsonDb();
      if (!db.labour_accounts) db.labour_accounts = [];
      const existingIdx = db.labour_accounts.findIndex(e => e.id === Number(id));
      if (existingIdx !== -1) {
        const existing = db.labour_accounts[existingIdx];
        db.labour_accounts[existingIdx] = {
          id: Number(id),
          farmer_id: farmer_id || existing.farmer_id,
          date,
          worker_name,
          gender,
          work_type,
          crop,
          plot: plot || null,
          hours_worked: hours,
          daily_wage: wage,
          bonus: b,
          overtime: ot,
          advance: adv,
          payment_status,
          payment_mode,
          total_amount,
          notes: notes || null,
          created_at: existing.created_at || new Date().toISOString()
        };
        writeJsonDb(db);
        return db.labour_accounts[existingIdx];
      }
      return null;
    }
  },

  async deleteLabourAccount(id) {
    if (isMysql) {
      await pool.query('DELETE FROM labour_accounts WHERE id = ?', [id]);
      return true;
    } else {
      const db = readJsonDb();
      if (!db.labour_accounts) return false;
      const initialLength = db.labour_accounts.length;
      db.labour_accounts = db.labour_accounts.filter(e => e.id !== Number(id));
      if (db.labour_accounts.length < initialLength) {
        writeJsonDb(db);
        return true;
      }
      return false;
    }
  },

  // Admin DB operations
  async getAdminByEmail(email) {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
      return rows[0] || null;
    } else {
      const db = readJsonDb();
      if (!db.admins) db.admins = [];
      return db.admins.find(a => a.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async getAdminById(admin_id) {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM admins WHERE admin_id = ?', [admin_id]);
      return rows[0] || null;
    } else {
      const db = readJsonDb();
      if (!db.admins) db.admins = [];
      return db.admins.find(a => a.admin_id === admin_id) || null;
    }
  },

  async createAdmin(adminData) {
    const { name, email, password_hash, department } = adminData;
    const sanitized = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const admin_id = `QA-${sanitized || 'USER'}`;

    if (isMysql) {
      const [result] = await pool.query(
        'INSERT INTO admins (admin_id, name, email, password_hash, department) VALUES (?, ?, ?, ?, ?)',
        [admin_id, name, email, password_hash, department || 'Quality Assurance & Trust']
      );
      return {
        id: result.insertId,
        admin_id,
        name,
        email,
        department: department || 'Quality Assurance & Trust'
      };
    } else {
      const db = readJsonDb();
      if (!db.admins) db.admins = [];
      const newAdmin = {
        id: getNextId(db.admins),
        admin_id,
        name,
        email,
        password_hash,
        department: department || 'Quality Assurance & Trust',
        created_at: new Date().toISOString()
      };
      db.admins.push(newAdmin);
      writeJsonDb(db);
      return newAdmin;
    }
  },

  // --- FINANCE MODULE HELPERS ---
  async getAllCropCycles(farmer_id) {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM crop_cycles WHERE farmer_id = ? ORDER BY id DESC', [farmer_id]);
      return rows;
    } else {
      const db = readJsonDb();
      return (db.crop_cycles || []).filter(c => c.farmer_id === farmer_id);
    }
  },

  async createCropCycle(cycle) {
    const { farmer_id, crop_name, plot_identifier, season, start_date, end_date, status } = cycle;
    if (isMysql) {
      const [result] = await pool.query(
        'INSERT INTO crop_cycles (farmer_id, crop_name, plot_identifier, season, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [farmer_id, crop_name, plot_identifier, season || null, start_date, end_date || null, status || 'ACTIVE']
      );
      return { id: result.insertId, ...cycle };
    } else {
      const db = readJsonDb();
      if (!db.crop_cycles) db.crop_cycles = [];
      const newCycle = {
        id: getNextId(db.crop_cycles),
        farmer_id,
        crop_name,
        plot_identifier,
        season: season || null,
        start_date,
        end_date: end_date || null,
        status: status || 'ACTIVE',
        created_at: new Date().toISOString()
      };
      db.crop_cycles.push(newCycle);
      writeJsonDb(db);
      return newCycle;
    }
  },

  async updateCropCycle(id, cycle) {
    const { crop_name, plot_identifier, season, start_date, end_date, status } = cycle;
    if (isMysql) {
      await pool.query(
        'UPDATE crop_cycles SET crop_name = ?, plot_identifier = ?, season = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?',
        [crop_name, plot_identifier, season || null, start_date, end_date || null, status, id]
      );
      return { id, ...cycle };
    } else {
      const db = readJsonDb();
      const idx = (db.crop_cycles || []).findIndex(c => c.id === Number(id));
      if (idx !== -1) {
        db.crop_cycles[idx] = { ...db.crop_cycles[idx], crop_name, plot_identifier, season, start_date, end_date, status };
        writeJsonDb(db);
        return db.crop_cycles[idx];
      }
      return null;
    }
  },

  async deleteCropCycle(id) {
    if (isMysql) {
      const [result] = await pool.query('DELETE FROM crop_cycles WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } else {
      const db = readJsonDb();
      const initialLength = (db.crop_cycles || []).length;
      db.crop_cycles = (db.crop_cycles || []).filter(c => c.id !== Number(id));
      db.transactions = (db.transactions || []).map(t => t.crop_cycle_id === Number(id) ? { ...t, crop_cycle_id: null } : t);
      writeJsonDb(db);
      return db.crop_cycles.length < initialLength;
    }
  },

  async getAllCreditContacts(farmer_id) {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM credit_contacts WHERE farmer_id = ? ORDER BY contact_name ASC', [farmer_id]);
      return rows;
    } else {
      const db = readJsonDb();
      return (db.credit_contacts || []).filter(c => c.farmer_id === farmer_id);
    }
  },

  async createCreditContact(contact) {
    const { farmer_id, contact_name, contact_type, phone_number, running_balance } = contact;
    if (isMysql) {
      const [result] = await pool.query(
        'INSERT INTO credit_contacts (farmer_id, contact_name, contact_type, phone_number, running_balance) VALUES (?, ?, ?, ?, ?)',
        [farmer_id, contact_name, contact_type, phone_number || null, running_balance || 0.00]
      );
      return { id: result.insertId, ...contact };
    } else {
      const db = readJsonDb();
      if (!db.credit_contacts) db.credit_contacts = [];
      const newContact = {
        id: getNextId(db.credit_contacts),
        farmer_id,
        contact_name,
        contact_type,
        phone_number: phone_number || null,
        running_balance: parseFloat(running_balance || 0.00),
        updated_at: new Date().toISOString()
      };
      db.credit_contacts.push(newContact);
      writeJsonDb(db);
      return newContact;
    }
  },

  async updateCreditContact(id, contact) {
    const { contact_name, contact_type, phone_number, running_balance } = contact;
    if (isMysql) {
      await pool.query(
        'UPDATE credit_contacts SET contact_name = ?, contact_type = ?, phone_number = ?, running_balance = ? WHERE id = ?',
        [contact_name, contact_type, phone_number || null, running_balance, id]
      );
      return { id, ...contact };
    } else {
      const db = readJsonDb();
      const idx = (db.credit_contacts || []).findIndex(c => c.id === Number(id));
      if (idx !== -1) {
        db.credit_contacts[idx] = { ...db.credit_contacts[idx], contact_name, contact_type, phone_number, running_balance: parseFloat(running_balance) };
        writeJsonDb(db);
        return db.credit_contacts[idx];
      }
      return null;
    }
  },

  async deleteCreditContact(id) {
    if (isMysql) {
      const [result] = await pool.query('DELETE FROM credit_contacts WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } else {
      const db = readJsonDb();
      const initialLength = (db.credit_contacts || []).length;
      db.credit_contacts = (db.credit_contacts || []).filter(c => c.id !== Number(id));
      db.transactions = (db.transactions || []).map(t => t.credit_contact_id === Number(id) ? { ...t, credit_contact_id: null } : t);
      writeJsonDb(db);
      return db.credit_contacts.length < initialLength;
    }
  },

  async getAllTransactions(farmer_id) {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM transactions WHERE farmer_id = ? ORDER BY transaction_date DESC, id DESC', [farmer_id]);
      return rows;
    } else {
      const db = readJsonDb();
      return (db.transactions || []).filter(t => t.farmer_id === farmer_id);
    }
  },

  async createTransaction(tx) {
    const { farmer_id, crop_cycle_id, credit_contact_id, transaction_type, category, amount, payment_mode, transaction_date, notes } = tx;
    if (isMysql) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [result] = await conn.query(
          'INSERT INTO transactions (farmer_id, crop_cycle_id, credit_contact_id, transaction_type, category, amount, payment_mode, transaction_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [farmer_id, crop_cycle_id || null, credit_contact_id || null, transaction_type, category, amount, payment_mode, transaction_date, notes || null]
        );
        
        if (payment_mode === 'UDHAAR' && credit_contact_id) {
          const balanceImpact = transaction_type === 'EXPENSE' ? amount : -amount;
          await conn.query(
            'UPDATE credit_contacts SET running_balance = running_balance + ? WHERE id = ?',
            [balanceImpact, credit_contact_id]
          );
        }
        await conn.commit();
        return { id: result.insertId, ...tx };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } else {
      const db = readJsonDb();
      if (!db.transactions) db.transactions = [];
      const newTx = {
        id: getNextId(db.transactions),
        farmer_id,
        crop_cycle_id: crop_cycle_id ? Number(crop_cycle_id) : null,
        credit_contact_id: credit_contact_id ? Number(credit_contact_id) : null,
        transaction_type,
        category,
        amount: parseFloat(amount),
        payment_mode,
        transaction_date,
        notes: notes || null,
        created_at: new Date().toISOString()
      };
      db.transactions.push(newTx);
      
      if (payment_mode === 'UDHAAR' && credit_contact_id) {
        const contact = (db.credit_contacts || []).find(c => c.id === Number(credit_contact_id));
        if (contact) {
          const balanceImpact = transaction_type === 'EXPENSE' ? parseFloat(amount) : -parseFloat(amount);
          contact.running_balance = parseFloat((contact.running_balance + balanceImpact).toFixed(2));
        }
      }
      writeJsonDb(db);
      return newTx;
    }
  },

  async deleteTransaction(id) {
    if (isMysql) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [rows] = await conn.query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (rows.length === 0) {
          await conn.rollback();
          return false;
        }
        const tx = rows[0];
        
        if (tx.payment_mode === 'UDHAAR' && tx.credit_contact_id) {
          const balanceImpact = tx.transaction_type === 'EXPENSE' ? -tx.amount : tx.amount;
          await conn.query(
            'UPDATE credit_contacts SET running_balance = running_balance + ? WHERE id = ?',
            [balanceImpact, tx.credit_contact_id]
          );
        }
        
        await conn.query('DELETE FROM transactions WHERE id = ?', [id]);
        await conn.commit();
        return true;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } else {
      const db = readJsonDb();
      const txIdx = (db.transactions || []).findIndex(t => t.id === Number(id));
      if (txIdx === -1) return false;
      const tx = db.transactions[txIdx];
      
      if (tx.payment_mode === 'UDHAAR' && tx.credit_contact_id) {
        const contact = (db.credit_contacts || []).find(c => c.id === Number(tx.credit_contact_id));
        if (contact) {
          const balanceImpact = tx.transaction_type === 'EXPENSE' ? -tx.amount : tx.amount;
          contact.running_balance = parseFloat((contact.running_balance + balanceImpact).toFixed(2));
        }
      }
      db.transactions.splice(txIdx, 1);
      writeJsonDb(db);
      return true;
    }
  },

  async updateTransaction(id, tx) {
    const { farmer_id, crop_cycle_id, credit_contact_id, transaction_type, category, amount, payment_mode, transaction_date, notes } = tx;
    if (isMysql) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [rows] = await conn.query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (rows.length === 0) {
          await conn.rollback();
          return null;
        }
        const oldTx = rows[0];

        // 1. Revert old balance impact
        if (oldTx.payment_mode === 'UDHAAR' && oldTx.credit_contact_id) {
          const oldImpact = oldTx.transaction_type === 'EXPENSE' ? -oldTx.amount : oldTx.amount;
          await conn.query(
            'UPDATE credit_contacts SET running_balance = running_balance + ? WHERE id = ?',
            [oldImpact, oldTx.credit_contact_id]
          );
        }

        // 2. Apply new balance impact
        if (payment_mode === 'UDHAAR' && credit_contact_id) {
          const newImpact = transaction_type === 'EXPENSE' ? amount : -amount;
          await conn.query(
            'UPDATE credit_contacts SET running_balance = running_balance + ? WHERE id = ?',
            [newImpact, credit_contact_id]
          );
        }

        await conn.query(
          'UPDATE transactions SET crop_cycle_id = ?, credit_contact_id = ?, transaction_type = ?, category = ?, amount = ?, payment_mode = ?, transaction_date = ?, notes = ? WHERE id = ?',
          [crop_cycle_id || null, credit_contact_id || null, transaction_type, category, amount, payment_mode, transaction_date, notes || null, id]
        );

        await conn.commit();
        return { id, ...tx };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } else {
      const db = readJsonDb();
      if (!db.transactions) db.transactions = [];
      const txIdx = db.transactions.findIndex(t => t.id === Number(id));
      if (txIdx !== -1) {
        const oldTx = db.transactions[txIdx];

        // 1. Revert old balance
        if (oldTx.payment_mode === 'UDHAAR' && oldTx.credit_contact_id) {
          const contact = (db.credit_contacts || []).find(c => c.id === Number(oldTx.credit_contact_id));
          if (contact) {
            const oldImpact = oldTx.transaction_type === 'EXPENSE' ? -oldTx.amount : oldTx.amount;
            contact.running_balance = parseFloat((contact.running_balance + oldImpact).toFixed(2));
          }
        }

        // 2. Apply new balance
        if (payment_mode === 'UDHAAR' && credit_contact_id) {
          const contact = (db.credit_contacts || []).find(c => c.id === Number(credit_contact_id));
          if (contact) {
            const newImpact = transaction_type === 'EXPENSE' ? parseFloat(amount) : -parseFloat(amount);
            contact.running_balance = parseFloat((contact.running_balance + newImpact).toFixed(2));
          }
        }

        db.transactions[txIdx] = {
          ...oldTx,
          crop_cycle_id: crop_cycle_id ? Number(crop_cycle_id) : null,
          credit_contact_id: credit_contact_id ? Number(credit_contact_id) : null,
          transaction_type,
          category,
          amount: parseFloat(amount),
          payment_mode,
          transaction_date,
          notes: notes || null
        };
        writeJsonDb(db);
        return db.transactions[txIdx];
      }
      return null;
    }
  },

  // Subsidies CRUD helpers
  async getAllSubsidies(farmer_id) {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM subsidies WHERE farmer_id = ? ORDER BY id DESC', [farmer_id]);
      return rows;
    } else {
      const db = readJsonDb();
      return (db.subsidies || []).filter(s => s.farmer_id === farmer_id);
    }
  },

  async createSubsidy(subsidy) {
    const { farmer_id, scheme_name, amount, status, date_received } = subsidy;
    if (isMysql) {
      const [result] = await pool.query(
        'INSERT INTO subsidies (farmer_id, scheme_name, amount, status, date_received) VALUES (?, ?, ?, ?, ?)',
        [farmer_id, scheme_name, amount, status, date_received || null]
      );
      return { id: result.insertId, ...subsidy };
    } else {
      const db = readJsonDb();
      if (!db.subsidies) db.subsidies = [];
      const newSubsidy = {
        id: getNextId(db.subsidies),
        farmer_id,
        scheme_name,
        amount: parseFloat(amount),
        status,
        date_received: date_received || null,
        created_at: new Date().toISOString()
      };
      db.subsidies.push(newSubsidy);
      writeJsonDb(db);
      return newSubsidy;
    }
  },

  async updateSubsidy(id, subsidy) {
    const { scheme_name, amount, status, date_received } = subsidy;
    if (isMysql) {
      await pool.query(
        'UPDATE subsidies SET scheme_name = ?, amount = ?, status = ?, date_received = ? WHERE id = ?',
        [scheme_name, amount, status, date_received || null, id]
      );
      return { id, ...subsidy };
    } else {
      const db = readJsonDb();
      if (!db.subsidies) db.subsidies = [];
      const idx = db.subsidies.findIndex(s => s.id === Number(id));
      if (idx !== -1) {
        db.subsidies[idx] = {
          ...db.subsidies[idx],
          scheme_name,
          amount: parseFloat(amount),
          status,
          date_received: date_received || null
        };
        writeJsonDb(db);
        return db.subsidies[idx];
      }
      return null;
    }
  },

  async deleteSubsidy(id) {
    if (isMysql) {
      const [result] = await pool.query('DELETE FROM subsidies WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } else {
      const db = readJsonDb();
      if (!db.subsidies) return false;
      const initialLength = db.subsidies.length;
      db.subsidies = db.subsidies.filter(s => s.id !== Number(id));
      if (db.subsidies.length < initialLength) {
        writeJsonDb(db);
        return true;
      }
      return false;
    }
  },

  async getKccAccounts(farmer_id) {
    if (isMysql) {
      const [rows] = await pool.query('SELECT * FROM kcc_accounts WHERE farmer_id = ?', [farmer_id]);
      return rows;
    } else {
      const db = readJsonDb();
      return (db.kcc_accounts || []).filter(k => k.farmer_id === farmer_id);
    }
  },

  async createOrUpdateKccAccount(kcc) {
    const { farmer_id, bank_name, sanctioned_limit, emi, current_outstanding, base_interest_rate, subvention_interest_rate, subvention_deadline, due_date } = kcc;
    if (isMysql) {
      const [existing] = await pool.query('SELECT * FROM kcc_accounts WHERE farmer_id = ?', [farmer_id]);
      if (existing.length > 0) {
        await pool.query(
          'UPDATE kcc_accounts SET bank_name = ?, sanctioned_limit = ?, emi = ?, current_outstanding = ?, base_interest_rate = ?, subvention_interest_rate = ?, subvention_deadline = ?, due_date = ? WHERE farmer_id = ?',
          [bank_name, sanctioned_limit, emi || 0.00, current_outstanding, base_interest_rate, subvention_interest_rate, subvention_deadline, due_date || null, farmer_id]
        );
        return { id: existing[0].id, ...kcc };
      } else {
        const [result] = await pool.query(
          'INSERT INTO kcc_accounts (farmer_id, bank_name, sanctioned_limit, emi, current_outstanding, base_interest_rate, subvention_interest_rate, subvention_deadline, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [farmer_id, bank_name, sanctioned_limit, emi || 0.00, current_outstanding, base_interest_rate, subvention_interest_rate, subvention_deadline, due_date || null]
        );
        return { id: result.insertId, ...kcc };
      }
    } else {
      const db = readJsonDb();
      if (!db.kcc_accounts) db.kcc_accounts = [];
      const idx = db.kcc_accounts.findIndex(k => k.farmer_id === farmer_id);
      const newKcc = {
        farmer_id,
        bank_name,
        sanctioned_limit: parseFloat(sanctioned_limit),
        emi: parseFloat(emi || 0.00),
        current_outstanding: parseFloat(current_outstanding),
        base_interest_rate: parseFloat(base_interest_rate),
        subvention_interest_rate: parseFloat(subvention_interest_rate),
        subvention_deadline,
        due_date: due_date || null,
        updated_at: new Date().toISOString()
      };
      if (idx !== -1) {
        db.kcc_accounts[idx] = { id: db.kcc_accounts[idx].id, ...newKcc };
      } else {
        newKcc.id = getNextId(db.kcc_accounts);
        db.kcc_accounts.push(newKcc);
      }
      writeJsonDb(db);
      return newKcc;
    }
  },

  async getLatestTelemetry() {
    let temperature = null;
    let soilMoisture = null;

    await executeImmudbAction(async (sessionID) => {
      // 1. Fetch latest from farm_logs (temperature)
      try {
        const res = await fetch(`http://${IMMUDB_HOST}:${IMMUDB_PORT}/api/db/sqlquery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'sessionID': sessionID },
          body: JSON.stringify({
            sql: 'SELECT reading_value FROM farm_logs ORDER BY id DESC LIMIT 1;'
          }),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.rows && data.rows.length > 0 && data.rows[0].values && data.rows[0].values.length > 0) {
            const valObj = data.rows[0].values[0];
            temperature = valObj.f !== undefined ? valObj.f : (valObj.n !== undefined ? parseInt(valObj.n, 10) : parseFloat(valObj.s));
          }
        }
      } catch (err) {
        console.warn('Failed to query farm_logs from VPS immudb:', err.message);
      }

      // 2. Fetch latest from sensor_data (moisture)
      try {
        const res = await fetch(`http://${IMMUDB_HOST}:${IMMUDB_PORT}/api/db/sqlquery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'sessionID': sessionID },
          body: JSON.stringify({
            sql: 'SELECT reading_value FROM sensor_data ORDER BY id DESC LIMIT 1;'
          }),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.rows && data.rows.length > 0 && data.rows[0].values && data.rows[0].values.length > 0) {
            const valObj = data.rows[0].values[0];
            const rawMoisture = valObj.n !== undefined ? parseInt(valObj.n, 10) : (valObj.f !== undefined ? valObj.f : parseFloat(valObj.s));
            // Map 245 -> 49%
            soilMoisture = rawMoisture > 100 ? parseFloat((rawMoisture / 5).toFixed(1)) : rawMoisture;
          }
        }
      } catch (err) {
        console.warn('Failed to query sensor_data from VPS immudb:', err.message);
      }
    });

    return {
      temperature: temperature || 22.6,
      soilMoisture: soilMoisture || 43.0,
      phLevel: 6.4,
      humidity: 68.4
    };
  },

  // Save global community post
  async saveCommunityPost(postData) {
    const {
      author_name,
      author_username,
      author_avatar,
      author_verified,
      author_location,
      content,
      attachment_url,
      attachment_type,
      crop_tag
    } = postData;

    if (isMysql) {
      const [result] = await pool.query(
        `INSERT INTO community_posts (author_name, author_username, author_avatar, author_verified, author_location, content, attachment_url, attachment_type, crop_tag, likes_count, comments_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          author_name,
          author_username,
          author_avatar || null,
          author_verified ? 1 : 0,
          author_location || null,
          content || null,
          attachment_url || null,
          attachment_type || null,
          crop_tag || 'general'
        ]
      );
      return { id: result.insertId, ...postData, likes_count: 0, comments_count: 0, created_at: new Date().toISOString() };
    } else {
      const db = readJsonDb();
      if (!db.community_posts) {
        db.community_posts = [];
      }
      const newPost = {
        id: `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        author_name,
        author_username,
        author_avatar: author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60',
        author_verified: !!author_verified,
        author_location: author_location || 'Global Hub',
        content: content || '',
        attachment_url: attachment_url || null,
        attachment_type: attachment_type || null,
        likes_count: 0,
        comments_count: 0,
        crop_tag: crop_tag || 'general',
        created_at: new Date().toISOString()
      };
      db.community_posts.push(newPost);
      writeJsonDb(db);
      return newPost;
    }
  },

  // Get all global community posts
  async getCommunityPosts() {
    if (isMysql) {
      const [rows] = await pool.query(
        'SELECT * FROM community_posts ORDER BY created_at DESC'
      );
      return rows;
    } else {
      const db = readJsonDb();
      return db.community_posts || [];
    }
  }
};
