import crypto from 'crypto';

export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve({
        hash: derivedKey.toString('hex'),
        salt: salt
      });
    });
  });
}

export function verifyPassword(password, hash, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      const hashBuffer = Buffer.from(hash, 'hex');
      const derivedBuffer = derivedKey; // derivedKey is a Buffer
      if (hashBuffer.length !== derivedBuffer.length) {
        return resolve(false);
      }
      resolve(crypto.timingSafeEqual(hashBuffer, derivedBuffer));
    });
  });
}
