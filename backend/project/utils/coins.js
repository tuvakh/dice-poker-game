import { WEEKLY_COIN_GRANT } from "../config/constants.js";

// Grants 100 coins per missed calendar week since the last grant date.
export async function applyWeeklyCoinGrant(user, now = new Date()) {
    // Backward compatibility: initialize wallet fields for users created before coins existed.
    const hasCoins = Number.isFinite(user.coins);
    const hasLastGrant = user.lastWeeklyCoinGrantAt instanceof Date || typeof user.lastWeeklyCoinGrantAt === 'string';

    if (!hasCoins || !hasLastGrant) {
        user.coins = WEEKLY_COIN_GRANT;
        user.lastWeeklyCoinGrantAt = now;
        await user.save();
        return { grantedCoins: WEEKLY_COIN_GRANT };
    }

    const lastGrantDate = new Date(user.lastWeeklyCoinGrantAt);
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const elapsedWeeks = Math.floor((now - lastGrantDate) / SEVEN_DAYS_MS);

    if (elapsedWeeks <= 0) return { grantedCoins: 0 };

    const grantedCoins = elapsedWeeks * WEEKLY_COIN_GRANT;
    user.coins += grantedCoins;
    user.lastWeeklyCoinGrantAt = now;
    await user.save();
    return { grantedCoins };
}
