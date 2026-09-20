import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../../config/env.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);

// El access token es breve y autoriza las llamadas del frontend a la API.
export function createAccessToken(user) {
  return new SignJWT({ email: user.email, role: user.role, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
  return payload;
}

// Los refresh tokens y códigos OAuth se generan aleatoriamente y se guardan hasheados.
export const randomToken = () => crypto.randomBytes(48).toString('base64url');
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// El estado firmado evita callbacks OAuth falsificados.
export function createOAuthState(provider) {
  return new SignJWT({ provider, nonce: crypto.randomUUID() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(secret);
}

export async function verifyOAuthState(state, provider) {
  const { payload } = await jwtVerify(state, secret, { algorithms: ['HS256'] });
  return payload.provider === provider;
}
