

import { User } from '../models/User.js';
import { applyMonthlyCoinGrant } from '../utils/coins.js';

export async function grantMonthlyCoinsBatch() {
    try {
        console.log('[Scheduler] Running monthly coin grant batch...');
        
        const users = await User.find({});
        
        if (!users || users.length === 0) {
            console.log('[Scheduler] No users found to grant coins.');
            return;
        }

        let grantedCount = 0;
        let totalCoinsGranted = 0;

        for (const user of users) {
            try {
                const result = await applyMonthlyCoinGrant(user);
                
                if (result.grantedCoins > 0) {
                    grantedCount++;
                    totalCoinsGranted += result.grantedCoins;
                    console.log(`[Scheduler] Granted ${result.grantedCoins} coins to user ${user.username}`);
                }
            } catch (err) {
                console.error(`[Scheduler] Error granting coins to user ${user.username}:`, err.message);
            }
        }

        console.log(`[Scheduler] Monthly coin grant batch completed. Granted coins to ${grantedCount} users (${totalCoinsGranted} total coins distributed).`);
    } catch (err) {
        console.error('[Scheduler] Error during monthly coin grant batch:', err.message);
    }
}