// This hash password structure uses MD5 with both global and per-user salts
// Global salt: APP_SALT from environment variables (shared across all users)
// Per-user salt: Random salt stored per user (unique to each user)
// This provides defense in depth against rainbow tables and brute force attacks

import crypto from "node:crypto";

const { APP_SALT: globalSalt } = process.env;

/**
 * Generate a random per-user salt (16 bytes = 128 bits of entropy)
 * @returns {string} Hex-encoded random salt
 */
export function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash a password using MD5 with global salt and per-user salt
 * @param {string} password - Plaintext password
 * @param {string} userSalt - Per-user salt (hex string)
 * @returns {string} MD5 hash (hex)
 */
export function hashPassword(password, userSalt) {
    // Combine: password + global salt + per-user salt
    const stringToHash = password + globalSalt + userSalt;
    // digest("hex") returns the hash as a readable hexadecimal string
    return crypto.createHash("md5").update(stringToHash).digest("hex").toString();
}

/**
 * Verify a password against a stored hash
 * @param {string} password - Plaintext password to check
 * @param {string} hashedPassword - Stored hash
 * @param {string} userSalt - Per-user salt from database
 * @returns {boolean} True if password matches, false otherwise
 */
export function checkPassword(password, hashedPassword, userSalt) {
    const newHash = hashPassword(password, userSalt);
    return newHash === hashedPassword;
}