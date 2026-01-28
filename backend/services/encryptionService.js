const crypto = require('crypto');
const NodeRSA = require('node-rsa');

/**
 * Encryption Service
 * Provides AES-256 and RSA-2048 encryption for secure design storage
 * Includes digital signature and digital envelope functionality
 */

// ============================================
// RSA Key Management
// ============================================

/**
 * Generate RSA-2048 key pair
 * @returns {Object} { publicKey, privateKey } in PEM format
 */
const generateRSAKeyPair = () => {
  console.log(`[${new Date().toISOString()}] [KEY_GEN] 🔑 Generating RSA-2048 key pair...`);
  
  const key = new NodeRSA({ b: 2048 });
  const publicKey = key.exportKey('public');
  const privateKey = key.exportKey('private');
  
  console.log(`[${new Date().toISOString()}] [KEY_GEN] ✅ RSA key pair generated successfully`);
  
  return { publicKey, privateKey };
};

/**
 * Encrypt private key with user password using AES-256
 * @param {string} privateKey - RSA private key in PEM format
 * @param {string} password - User password
 * @returns {string} Encrypted private key (base64)
 */
const encryptPrivateKey = (privateKey, password) => {
  console.log(`[${new Date().toISOString()}] [ENCRYPTION] 🔐 Encrypting private key with password...`);
  
  // Derive key from password using PBKDF2
  const salt = crypto.randomBytes(32);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  // Encrypt private key with AES-256-CBC
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Combine salt + iv + encrypted data
  const result = {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    encryptedData: encrypted
  };
  
  console.log(`[${new Date().toISOString()}] [ENCRYPTION] ✅ Private key encrypted successfully`);
  
  return JSON.stringify(result);
};

/**
 * Decrypt private key with user password
 * @param {string} encryptedPrivateKey - Encrypted private key (JSON string)
 * @param {string} password - User password
 * @returns {string} Decrypted private key in PEM format
 */
const decryptPrivateKey = (encryptedPrivateKey, password) => {
  console.log(`[${new Date().toISOString()}] [DECRYPTION] 🔓 Decrypting private key...`);
  
  try {
    const { salt, iv, encryptedData } = JSON.parse(encryptedPrivateKey);
    
    // Derive key from password
    const key = crypto.pbkdf2Sync(
      password,
      Buffer.from(salt, 'base64'),
      100000,
      32,
      'sha256'
    );
    
    // Decrypt with AES-256-CBC
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      key,
      Buffer.from(iv, 'base64')
    );
    
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log(`[${new Date().toISOString()}] [DECRYPTION] ✅ Private key decrypted successfully`);
    
    return decrypted;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [DECRYPTION] ❌ Failed to decrypt private key:`, error.message);
    throw new Error('Invalid password or corrupted key');
  }
};

// ============================================
// AES Encryption
// ============================================

/**
 * Generate random AES-256 key
 * @returns {Buffer} 32-byte AES key
 */
const generateAESKey = () => {
  console.log(`[${new Date().toISOString()}] [KEY_GEN] 🔑 Generating AES-256 key...`);
  const key = crypto.randomBytes(32); // 256 bits
  console.log(`[${new Date().toISOString()}] [KEY_GEN] 📊 AES Key (hex): ${key.toString('hex')}`);
  console.log(`[${new Date().toISOString()}] [KEY_GEN] 📊 AES Key (base64): ${key.toString('base64')}`);
  console.log(`[${new Date().toISOString()}] [KEY_GEN] ✅ AES-256 key generated (32 bytes)`);
  return key;
};

/**
 * Generate random initialization vector
 * @returns {Buffer} 16-byte IV
 */
const generateIV = () => {
  console.log(`[${new Date().toISOString()}] [KEY_GEN] 🔑 Generating IV (Initialization Vector)...`);
  const iv = crypto.randomBytes(16); // 128 bits for AES
  console.log(`[${new Date().toISOString()}] [KEY_GEN] 📊 IV (hex): ${iv.toString('hex')}`);
  console.log(`[${new Date().toISOString()}] [KEY_GEN] 📊 IV (base64): ${iv.toString('base64')}`);
  console.log(`[${new Date().toISOString()}] [KEY_GEN] ✅ IV generated (16 bytes)`);
  return iv;
};

/**
 * Encrypt data with AES-256-CBC
 * @param {string|Object} data - Data to encrypt
 * @param {Buffer} key - AES key
 * @param {Buffer} iv - Initialization vector
 * @returns {string} Encrypted data (base64)
 */
const encryptWithAES = (data, key, iv) => {
  console.log(`[${new Date().toISOString()}] [ENCRYPTION] 🔐 Encrypting data with AES-256-CBC...`);
  console.log(`[${new Date().toISOString()}] [ENCRYPTION] 📊 Using AES Key (first 16 chars): ${key.toString('hex').substring(0, 32)}...`);
  console.log(`[${new Date().toISOString()}] [ENCRYPTION] 📊 Using IV: ${iv.toString('hex')}`);
  
  const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
  console.log(`[${new Date().toISOString()}] [ENCRYPTION] 📝 Original data size: ${dataString.length} bytes`);
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(dataString, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  console.log(`[${new Date().toISOString()}] [ENCRYPTION] 📝 Encrypted data size: ${encrypted.length} characters`);
  console.log(`[${new Date().toISOString()}] [ENCRYPTION] ✅ Data encrypted successfully`);
  
  return encrypted;
};

/**
 * Decrypt data with AES-256-CBC
 * @param {string} encryptedData - Encrypted data (base64)
 * @param {Buffer} key - AES key
 * @param {Buffer} iv - Initialization vector
 * @returns {string|Object} Decrypted data
 */
const decryptWithAES = (encryptedData, key, iv) => {
  console.log(`[${new Date().toISOString()}] [DECRYPTION] 🔓 Decrypting data with AES-256-CBC...`);
  console.log(`[${new Date().toISOString()}] [DECRYPTION] 📊 Using AES Key (first 16 chars): ${key.toString('hex').substring(0, 32)}...`);
  console.log(`[${new Date().toISOString()}] [DECRYPTION] 📊 Using IV: ${iv.toString('hex')}`);
  console.log(`[${new Date().toISOString()}] [DECRYPTION] 📝 Encrypted data size: ${encryptedData.length} characters`);
  
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log(`[${new Date().toISOString()}] [DECRYPTION] 📝 Decrypted data size: ${decrypted.length} bytes`);
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(decrypted);
      console.log(`[${new Date().toISOString()}] [DECRYPTION] ✅ Data decrypted and parsed as JSON`);
      return parsed;
    } catch {
      console.log(`[${new Date().toISOString()}] [DECRYPTION] ✅ Data decrypted as string`);
      return decrypted;
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [DECRYPTION] ❌ Decryption failed:`, error.message);
    throw new Error('Decryption failed');
  }
};

// ============================================
// RSA Encryption (for AES keys)
// ============================================

/**
 * Encrypt AES key with RSA public key
 * @param {Buffer} aesKey - AES key to encrypt
 * @param {string} publicKey - RSA public key (PEM format)
 * @returns {string} Encrypted AES key (base64)
 */
const encryptAESKeyWithRSA = (aesKey, publicKey) => {
  console.log(`[${new Date().toISOString()}] [ENCRYPTION] 🔐 Encrypting AES key with RSA public key...`);
  
  const key = new NodeRSA(publicKey);
  const encrypted = key.encrypt(aesKey, 'base64');
  
  console.log(`[${new Date().toISOString()}] [ENCRYPTION] ✅ AES key encrypted with RSA`);
  
  return encrypted;
};

/**
 * Decrypt AES key with RSA private key
 * @param {string} encryptedKey - Encrypted AES key (base64)
 * @param {string} privateKey - RSA private key (PEM format)
 * @returns {Buffer} Decrypted AES key
 */
const decryptAESKeyWithRSA = (encryptedKey, privateKey) => {
  console.log(`[${new Date().toISOString()}] [DECRYPTION] 🔓 Decrypting AES key with RSA private key...`);
  
  try {
    const key = new NodeRSA(privateKey);
    const decrypted = key.decrypt(encryptedKey);
    
    console.log(`[${new Date().toISOString()}] [DECRYPTION] ✅ AES key decrypted with RSA`);
    
    return decrypted;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [DECRYPTION] ❌ RSA decryption failed:`, error.message);
    throw new Error('Failed to decrypt AES key');
  }
};

// ============================================
// Digital Signatures
// ============================================

/**
 * Create digital signature for data
 * @param {string|Object} data - Data to sign
 * @param {string} privateKey - RSA private key (PEM format)
 * @returns {string} Digital signature (base64)
 */
const createDigitalSignature = (data, privateKey) => {
  console.log(`[${new Date().toISOString()}] [SIGNATURE] ✍️  Creating digital signature...`);
  
  const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
  
  const key = new NodeRSA(privateKey);
  const signature = key.sign(dataString, 'base64');
  
  console.log(`[${new Date().toISOString()}] [SIGNATURE] ✅ Digital signature created`);
  
  return signature;
};

/**
 * Verify digital signature
 * @param {string|Object} data - Original data
 * @param {string} signature - Digital signature (base64)
 * @param {string} publicKey - RSA public key (PEM format)
 * @returns {boolean} True if signature is valid
 */
const verifyDigitalSignature = (data, signature, publicKey) => {
  console.log(`[${new Date().toISOString()}] [SIGNATURE] 🔍 Verifying digital signature...`);
  
  try {
    const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    const key = new NodeRSA(publicKey);
    const isValid = key.verify(dataString, signature, 'utf8', 'base64');
    
    if (isValid) {
      console.log(`[${new Date().toISOString()}] [SIGNATURE] ✅ Signature verified successfully`);
    } else {
      console.log(`[${new Date().toISOString()}] [SIGNATURE] ❌ Invalid signature`);
    }
    
    return isValid;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [SIGNATURE] ❌ Signature verification failed:`, error.message);
    return false;
  }
};

// ============================================
// Digital Envelope
// ============================================

/**
 * Create digital envelope (encrypted data + encrypted key + signature)
 * @param {string|Object} data - Data to protect
 * @param {string} recipientPublicKey - Recipient's RSA public key
 * @param {string} senderPrivateKey - Sender's RSA private key
 * @returns {Object} Digital envelope
 */
const createDigitalEnvelope = (data, recipientPublicKey, senderPrivateKey) => {
  console.log(`[${new Date().toISOString()}] [ENVELOPE] 📧 Creating digital envelope...`);
  
  // Generate AES key and IV
  const aesKey = generateAESKey();
  const iv = generateIV();
  
  // Encrypt data with AES
  const encryptedData = encryptWithAES(data, aesKey, iv);
  
  // Encrypt AES key with recipient's public key
  const encryptedAESKey = encryptAESKeyWithRSA(aesKey, recipientPublicKey);
  
  // Create digital signature
  const signature = createDigitalSignature(data, senderPrivateKey);
  
  const envelope = {
    encryptedData,
    encryptedAESKey,
    iv: iv.toString('base64'),
    signature,
    timestamp: new Date().toISOString()
  };
  
  console.log(`[${new Date().toISOString()}] [ENVELOPE] ✅ Digital envelope created successfully`);
  
  return envelope;
};

/**
 * Open digital envelope (decrypt and verify)
 * @param {Object} envelope - Digital envelope
 * @param {string} recipientPrivateKey - Recipient's RSA private key
 * @param {string} senderPublicKey - Sender's RSA public key
 * @returns {Object} { data, verified } - Decrypted data and signature verification status
 */
const openDigitalEnvelope = (envelope, recipientPrivateKey, senderPublicKey) => {
  console.log(`[${new Date().toISOString()}] [ENVELOPE] 📬 Opening digital envelope...`);
  
  try {
    const { encryptedData, encryptedAESKey, iv, signature } = envelope;
    
    // Decrypt AES key with recipient's private key
    const aesKey = decryptAESKeyWithRSA(encryptedAESKey, recipientPrivateKey);
    
    // Decrypt data with AES
    const data = decryptWithAES(encryptedData, aesKey, Buffer.from(iv, 'base64'));
    
    // Verify signature
    const verified = verifyDigitalSignature(data, signature, senderPublicKey);
    
    console.log(`[${new Date().toISOString()}] [ENVELOPE] ✅ Digital envelope opened (verified: ${verified})`);
    
    return { data, verified };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ENVELOPE] ❌ Failed to open envelope:`, error.message);
    throw new Error('Failed to open digital envelope');
  }
};

module.exports = {
  // RSA Key Management
  generateRSAKeyPair,
  encryptPrivateKey,
  decryptPrivateKey,
  
  // AES Encryption
  generateAESKey,
  generateIV,
  encryptWithAES,
  decryptWithAES,
  
  // RSA Encryption (for keys)
  encryptAESKeyWithRSA,
  decryptAESKeyWithRSA,
  
  // Digital Signatures
  createDigitalSignature,
  verifyDigitalSignature,
  
  // Digital Envelopes
  createDigitalEnvelope,
  openDigitalEnvelope
};
