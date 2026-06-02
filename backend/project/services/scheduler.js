import { User } from '../models/User.js';
import { applyWeeklyCoinGrant } from '../utils/coins.js';

// Runs once per week (triggered by the server's cron job) to distribute coins to all users.
// Each user is processed individually so a failure on one account doesn't abort the entire batch.
export async function grantWeeklyCoinsBatch() {
    try {
        console.log('[Scheduler] Running weekly coin grant batch...');

        const users = await User.find({});

        if (!users || users.length === 0) {
            console.log('[Scheduler] No users found to grant coins.');
            return;
        }

        let grantedCount = 0;
        let totalCoinsGranted = 0;

        // Process users one at a time; errors are caught per-user so one bad record doesn't stop the rest
        for (const user of users) {
            try {
                const result = await applyWeeklyCoinGrant(user);
                
                if (result.grantedCoins > 0) {
                    grantedCount++;
                    totalCoinsGranted += result.grantedCoins;
                    console.log(`[Scheduler] Granted ${result.grantedCoins} coins to user ${user.username}`);
                }
            } catch (err) {
                console.error(`[Scheduler] Error granting coins to user ${user.username}:`, err.message);
            }
        }

        console.log(`[Scheduler] Weekly coin grant batch completed. Granted coins to ${grantedCount} users (${totalCoinsGranted} total coins distributed).`);
    } catch (err) {
        console.error('[Scheduler] Error during weekly coin grant batch:', err.message);
    }
}