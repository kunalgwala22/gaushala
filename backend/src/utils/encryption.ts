import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Default key fallback if ENCRYPTION_KEY isn't configured in .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt-salt', 32)
  : crypto.scryptSync('default-dev-secret-key-please-change-in-prod', 'salt-salt', 32);

interface EncryptedData {
  encryptedText: string;
  iv: string;
  tag: string;
}

/**
 * Encrypts a string using AES-256-GCM
 */
export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag().toString('hex');
  
  return {
    encryptedText: encrypted,
    iv: iv.toString('hex'),
    tag: tag,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted string
 */
export function decrypt(encryptedText: string, ivHex: string, tagHex: string): string {
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return 'DECRYPTION_FAILED';
  }
}
