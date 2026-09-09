import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export type UserRole = 'student' | 'admin' | 'super_admin' | 'teacher' | 'content_manager' | 'support';

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized: User not authenticated', 401));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(new AppError('Forbidden: Access denied for your role', 403));
    }

    next();
  };
};

