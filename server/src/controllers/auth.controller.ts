import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, purpose } = req.body;
  const result = await AuthService.sendOtp(email, purpose);

  res.status(200).json({
    success: true,
    message: `Verification code sent to ${email}`,
    data: result,
  });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, purpose } = req.body;
  await AuthService.verifyOtp(email, otp, purpose);

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
  });
});

export const registerWithOtp = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await AuthService.registerWithOtp(req.body);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    message: 'User registered and verified successfully',
    data: { user, token },
  });
});

export const verifyAccountOtp = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await AuthService.verifyAccountOtp(req.body);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: 'Account verified successfully',
    data: { user, token },
  });
});

export const resetPasswordOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.resetPasswordWithOtp(req.body);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await AuthService.register(req.body);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { user, token },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await AuthService.login(req.body);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user, token },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.getUserProfile(req.user!.userId);
  res.status(200).json({
    success: true,
    data: { user },
  });
});
