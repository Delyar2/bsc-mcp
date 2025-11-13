import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const algorithm = 'aes-256-gcm';

/**
 * Encrypts an EVM private key using bcrypt and user password
 * @param privateKey The EVM private key to encrypt
 * @param password User-provided password
 * @returns Encrypted string (Base64 encoded)
 */
export async function encryptPrivateKey(privateKey: string, password: string): Promise<string> {
  // bcrypt work factor - higher is more secure but slower
  const saltRounds = 12;
  
  // Generate bcrypt hash as key material
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  // Extract bcrypt salt - it's in the first 29 characters of the hash
  const bcryptSalt = hashedPassword.substring(0, 29);
  
  // Generate symmetric encryption key using SHA-256 from bcrypt hash
  const key = crypto.createHash('sha256').update(hashedPassword).digest();
  
  // Generate random initialization vector
  const iv = crypto.randomBytes(12);
  
  // Create cipher object
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  // Encrypt private key
  let encrypted = cipher.update(privateKey, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  // Concatenate all necessary components and encode as Base64 string
  const result = Buffer.concat([
    Buffer.from(bcryptSalt), // Store bcrypt salt
    iv,
    authTag,
    Buffer.from(encrypted, 'base64')
  ]);
  
  return result.toString('base64');
}

/**
 * Decrypts an EVM private key using bcrypt and user password
 * @param encryptedData Encrypted private key data (Base64 encoded)
 * @param password User-provided password
 * @returns Decrypted private key or null (if password is incorrect)
 */
export async function decryptPrivateKey(encryptedData: string, password: string): Promise<string | null> {
  try {
    // Decode Base64
    const data = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const bcryptSalt = data.subarray(0, 29).toString();
    const iv = data.subarray(29, 41);
    const authTag = data.subarray(41, 57);
    const encrypted = data.subarray(57).toString('base64');
    
    // Use bcrypt to check password
    // Reconstruct salt and password to create the same hash as during encryption
    const hashedPassword = await bcrypt.hash(password, bcryptSalt);
    
    // Generate key using the same method from the hash
    const key = crypto.createHash('sha256').update(hashedPassword).digest();
    
    // Create decipher
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Decryption failed (incorrect password or data corruption)
    return null;
  }
}
