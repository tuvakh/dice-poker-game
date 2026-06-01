import crypto from "node:crypto";

export async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (err, key) => {
            if (err) reject(err);
            else resolve(key.toString('hex'));
        });
    });
    return `${salt}:${hash}`;
}

export async function checkPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = await new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (err, key) => {
            if (err) reject(err);
            else resolve(key.toString('hex'));
        });
    });
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}
