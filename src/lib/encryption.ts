import crypto from 'crypto';

// Get encryption key buffer from environment
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) {
    return Buffer.from(envKey, 'hex');
  }

  // Fallback: derive a key from JWT_SECRET or a default value using SHA-256
  // This ensures the application runs successfully even if ENCRYPTION_KEY is misconfigured in dev
  const secret = process.env.JWT_SECRET || 'fallback-dev-secret-key-12345';
  return crypto.createHash('sha256').update(secret).digest();
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM

export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Return concatenated: iv:authTag:encryptedText
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}
