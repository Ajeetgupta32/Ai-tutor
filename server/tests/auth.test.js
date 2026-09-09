import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from '../src/utils/jwt.js';
import bcrypt from 'bcryptjs';
describe('Auth Security Unit Tests', () => {
    it('should generate and verify valid JWT tokens', () => {
        const payload = {
            userId: '507f1f77bcf86cd799439011',
            role: 'student',
            email: 'teststudent@edumentor.ai',
        };
        const token = generateToken(payload);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        const decoded = verifyToken(token);
        expect(decoded.userId).toBe(payload.userId);
        expect(decoded.role).toBe(payload.role);
        expect(decoded.email).toBe(payload.email);
    });
    it('should hash and compare passwords correctly using bcrypt', async () => {
        const plain = 'SecretPassword123!';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(plain, salt);
        expect(hash).not.toBe(plain);
        const match = await bcrypt.compare(plain, hash);
        expect(match).toBe(true);
        const wrongMatch = await bcrypt.compare('WrongPass', hash);
        expect(wrongMatch).toBe(false);
    });
});
