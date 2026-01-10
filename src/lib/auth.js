import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ONE_DAY_SECONDS = 60 * 60 * 8;
export const AUTH_COOKIE_NAME = 'authToken';

export function signAuthToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ONE_DAY_SECONDS,
    ...options,
  });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function getAuthCookieOptions(overrides = {}) {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_DAY_SECONDS,
    ...overrides,
  };
}
