// =============================================================================
// Encryption Utility — Secure Field Cryptography (AES-256-CBC)
// =============================================================================
import crypto from "crypto";

// Use NEXTAUTH_SECRET as key base, default to fallback if undefined
const ENCRYPTION_KEY_BASE = process.env.NEXTAUTH_SECRET || "default-dev-modapk-store-encryption-key-fallback";

// Derive a secure 32-byte key from the secret using SHA-256
const KEY = crypto.createHash("sha256").update(ENCRYPTION_KEY_BASE).digest();
const IV_LENGTH = 16; // AES block size

/**
 * Encrypt a plain-text string using AES-256-CBC
 */
export function encrypt(text: string): string {
  if (!text) return "";
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Return IV prepended to the encrypted text
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an AES-256-CBC encrypted string
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";
  
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      // If it doesn't contain the delimiter, it's not encrypted or in correct format
      return encryptedText;
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = Buffer.from(parts[1], "hex");
    
    const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
    
    let decrypted = decipher.update(encrypted as any, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    console.error("Failed to decrypt field:", err);
    // Return original text as fallback if decryption fails (e.g. key changed or unencrypted)
    return encryptedText;
  }
}
