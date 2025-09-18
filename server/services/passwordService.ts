import argon2 from 'argon2';
import { randomBytes } from 'crypto';

export class PasswordService {
  /**
   * Hash a password using Argon2id
   */
  static async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch {
      return false;
    }
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Generate a reset token (returns raw token for email, stores hash in DB)
   */
  static generateResetToken(): { token: string; hash: string } {
    const token = randomBytes(32).toString('hex');
    const hash = this.hashToken(token);
    return { token, hash };
  }

  /**
   * Hash a token for secure storage
   */
  static hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verify a token against its hash
   */
  static verifyToken(token: string, hash: string): boolean {
    const tokenHash = this.hashToken(token);
    return this.constantTimeCompare(tokenHash, hash);
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}