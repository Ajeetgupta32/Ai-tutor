import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';
import { EmailService } from './email.service.js';

export class AuthService {
  /**
   * Send a 6-digit OTP code to email
   */
  static async sendOtp(email: string, purpose: string = 'registration') {
    const emailLower = email.trim().toLowerCase();
    if (!emailLower || !emailLower.includes('@')) {
      throw new AppError('Valid email address is required', 400);
    }

    // Purpose checks
    if (purpose === 'registration' || purpose === 'account_verification') {
      const existing = await prisma.user.findUnique({ where: { email: emailLower } });
      if (existing && existing.isEmailVerified) {
        throw new AppError('An account with this email already exists. Please sign in.', 400);
      }
    } else if (purpose === 'password_reset') {
      const existing = await prisma.user.findUnique({ where: { email: emailLower } });
      if (!existing) {
        throw new AppError('No registered account found with this email address.', 404);
      }
    }

    // Invalidate any previous unused OTP for this email and purpose
    await prisma.otpVerification.updateMany({
      where: { email: emailLower, purpose, isUsed: false },
      data: { isUsed: true },
    });

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpVerification.create({
      data: {
        email: emailLower,
        otp,
        purpose,
        expiresAt,
        isUsed: false,
      },
    });

    // Send email via Nodemailer
    await EmailService.sendOtpEmail({
      to: emailLower,
      otp,
      purpose,
    });

    console.log(`\n======================================================`);
    console.log(`📧 [EduMentor AI OTP Delivery via Nodemailer]`);
    console.log(`👤 Recipient: ${emailLower}`);
    console.log(`🔐 Purpose:   ${purpose.toUpperCase()}`);
    console.log(`🔑 OTP Code:  ${otp}`);
    console.log(`⏱️  Valid for: 10 minutes (expires ${expiresAt.toLocaleTimeString()})`);
    console.log(`======================================================\n`);

    return {
      email: emailLower,
      expiresAt,
    };
  }

  /**
   * Verify an OTP code
   */
  static async verifyOtp(email: string, otp: string, purpose: string = 'registration') {
    const emailLower = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const allowedPurposes = purpose === 'registration' || purpose === 'account_verification'
      ? ['registration', 'account_verification']
      : [purpose];

    const record = await prisma.otpVerification.findFirst({
      where: {
        email: emailLower,
        otp: cleanOtp,
        purpose: { in: allowedPurposes },
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new AppError('Invalid or expired OTP code. Please request a new code.', 400);
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { isUsed: true },
    });

    return true;
  }

  /**
   * Register a new user with required OTP verification
   */
  static async registerWithOtp(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    otp: string;
  }) {
    if (!data.otp || !data.otp.trim()) {
      throw new AppError('Verification OTP code is required', 400);
    }

    await this.verifyOtp(data.email, data.otp, 'registration');

    const emailLower = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      throw new AppError('User with this email already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: emailLower,
        passwordHash,
        role: data.role || 'student',
        isEmailVerified: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      role: user.role as 'student' | 'admin',
      email: user.email,
    });

    return { user: this.sanitizeUser(user), token };
  }

  /**
   * Verify an existing unverified account with OTP
   */
  static async verifyAccountOtp(data: { email: string; otp: string }) {
    const emailLower = data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user) {
      throw new AppError('Account not found with this email address.', 404);
    }

    await this.verifyOtp(emailLower, data.otp, 'registration');

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    const token = generateToken({
      userId: updatedUser.id,
      role: updatedUser.role as 'student' | 'admin',
      email: updatedUser.email,
    });

    return { user: this.sanitizeUser(updatedUser), token };
  }

  /**
   * Reset Password with OTP verification
   */
  static async resetPasswordWithOtp(data: {
    email: string;
    otp: string;
    newPassword: string;
  }) {
    const emailLower = data.email.trim().toLowerCase();
    if (!data.newPassword || data.newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400);
    }

    await this.verifyOtp(emailLower, data.otp, 'password_reset');

    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, isEmailVerified: true },
    });

    return { message: 'Password has been reset successfully. You can now log in.' };
  }

  static async register(data: { name: string; email: string; password: string; role?: string }) {
    const emailLower = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      throw new AppError('User with this email already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: emailLower,
        passwordHash,
        role: data.role || 'student',
        isEmailVerified: false,
      },
    });

    const token = generateToken({
      userId: user.id,
      role: user.role as 'student' | 'admin',
      email: user.email,
    });

    return { user: this.sanitizeUser(user), token };
  }

  static async login(data: { email: string; password: string }) {
    const emailLower = data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update study streak if last active was yesterday, reset if longer, keep if today
    const now = new Date();
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : now;
    const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 3600);

    let streak = user.studyStreak;
    if (diffHours >= 24 && diffHours < 48) {
      streak += 1;
    } else if (diffHours >= 48) {
      streak = 1;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        studyStreak: streak,
        lastActiveDate: now,
      },
    });

    const token = generateToken({
      userId: user.id,
      role: user.role as 'student' | 'admin',
      email: user.email,
    });

    return { user: this.sanitizeUser(updatedUser), token };
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return this.sanitizeUser(user);
  }

  private static sanitizeUser(user: any) {
    return {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      level: user.level,
      studyStreak: user.studyStreak,
      totalQuizCount: user.totalQuizCount,
      averageScore: user.averageScore,
      accuracyRate: user.accuracyRate,
      totalStudyTimeMinutes: user.totalStudyTimeMinutes,
      createdAt: user.createdAt,
    };
  }
}
