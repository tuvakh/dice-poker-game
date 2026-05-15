import { MONTHLY_COIN_GRANT } from "../config/constants.js";

function getMonthKey(date) {
    return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

function getElapsedCalendarMonths(fromDate, toDate) {
    return Math.max(0, getMonthKey(toDate) - getMonthKey(fromDate));
}

// Grants 100 coins per missed calendar month since the last grant date.
export async function applyMonthlyCoinGrant(user, now = new Date()) {
    // Backward compatibility: initialize wallet fields for users created before coins existed.
    const hasCoins = Number.isFinite(user.coins);
    const hasLastGrant = user.lastMonthlyCoinGrantAt instanceof Date || typeof user.lastMonthlyCoinGrantAt === "string";

    if (!hasCoins || !hasLastGrant) {
        user.coins = MONTHLY_COIN_GRANT;
        user.lastMonthlyCoinGrantAt = now;
        await user.save();
        return { grantedCoins: MONTHLY_COIN_GRANT };
    }

    const lastGrantDate = user.lastMonthlyCoinGrantAt ? new Date(user.lastMonthlyCoinGrantAt) : new Date(0);
    const elapsedMonths = getElapsedCalendarMonths(lastGrantDate, now);

    if (elapsedMonths <= 0) {
        return { grantedCoins: 0 };
    }

    const grantedCoins = elapsedMonths * MONTHLY_COIN_GRANT;
    user.coins += grantedCoins;
    user.lastMonthlyCoinGrantAt = now;
    await user.save();

    return { grantedCoins };
}
