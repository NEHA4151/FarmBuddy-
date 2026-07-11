import { dbService } from './dbService.js';
import { calculateGamificationState } from './gamification.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("Recalculating all batches...");
  try {
    const batches = await dbService.getAllBatches();
    for (const b of batches) {
      const details = await dbService.getBatchDetails(b.batch_id);
      const labour = await dbService.getAllLabourAccounts(b.batch_id);
      const aiHistory = await dbService.getAiHistory('FMR-0921');
      const gamified = calculateGamificationState(details, labour, aiHistory);
      
      const dbPath = path.join(__dirname, 'database.json');
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const overview = db.batch_overview.find(o => o.batch_id === b.batch_id);
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
        console.log(`Updated batch ${b.batch_id}: Points = ${gamified.totalPoints}, Trust Score = ${gamified.trustScore}%`);
      }
    }
    console.log("Recalculation complete!");
  } catch (e) {
    console.error("Error in recalculating batches:", e);
  }
  process.exit(0);
}

run();
