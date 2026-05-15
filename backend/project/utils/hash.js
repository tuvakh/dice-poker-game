// This hash password structure is the same example that where shown in the lectures! 
// I have added my own comments to show that I understand it

// This file handles password hashing and verification.
// It uses MD5 with an APP_SALT from environment variables for basic security.

import crypto from "node:crypto";

const { APP_SALT: salt } = process.env;

// hashPassword concatenates the password with the salt before hashing,
// so two users with the same password will have different hashes if the salt differs
export function hashPassword(password){
    const stringToHash = password + salt;
    // digest("hex") returns the hash as a readable hexadecimal string
    return crypto.createHash("md5").update(stringToHash).digest("hex").toString();
}

// checkPassword hashes the incoming plaintext password and compares it to the stored hash
// It returns true if they match, and false if not
export function checkPassword(password, hashedPassword){
    return hashPassword(password) === hashedPassword;
}