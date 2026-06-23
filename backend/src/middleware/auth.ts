import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-token-secret-key-123456';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-token-secret-key-654321';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'DONOR';
  donorId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware to authenticate requests via JWT access token
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authorization token required. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verify error:', error);
    return res.status(401).json({ message: 'Invalid or expired authorization token.' });
  }
};

/**
 * Middleware to restrict access to specific roles
 */
export const authorize = (roles: Array<'ADMIN' | 'STAFF' | 'DONOR'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

/**
 * Helper to generate access and refresh tokens
 */
export const generateTokens = (payload: Omit<TokenPayload, 'iat' | 'exp'>) => {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

/**
 * Helper to verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};
