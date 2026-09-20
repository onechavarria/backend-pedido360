import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../../config/env.js';
import { query, withTransaction } from '../../config/database.js';
import { AppError } from '../../shared/errors/app-error.js';
import { createOAuthState, verifyOAuthState } from '../../shared/security/tokens.js';
import { createUser, findOAuthAccount, findUserByEmail, linkOAuthAccount } from '../users/user.repository.js';

const callback = (provider) => `${env.BACKEND_PUBLIC_URL}/api/v1/auth/oauth/${provider}/callback`;

// Cada proveedor define sus URLs, permisos y credenciales de forma declarativa.
const providers = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET,
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile', userInfo: 'https://openidconnect.googleapis.com/v1/userinfo'
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET,
    authorize: 'https://github.com/login/oauth/authorize', token: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email', userInfo: 'https://api.github.com/user'
  },
  facebook: {
    clientId: env.FACEBOOK_CLIENT_ID, clientSecret: env.FACEBOOK_CLIENT_SECRET,
    authorize: 'https://www.facebook.com/v21.0/dialog/oauth', token: 'https://graph.facebook.com/v21.0/oauth/access_token',
    scope: 'email public_profile', userInfo: 'https://graph.facebook.com/me?fields=id,name,email,picture'
  },
  microsoft: {
    clientId: env.MICROSOFT_CLIENT_ID, clientSecret: env.MICROSOFT_CLIENT_SECRET,
    authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token', scope: 'openid email profile User.Read',
    userInfo: 'https://graph.microsoft.com/v1.0/me'
  },
  apple: {
    clientId: env.APPLE_CLIENT_ID, clientSecret: env.APPLE_CLIENT_SECRET,
    authorize: 'https://appleid.apple.com/auth/authorize', token: 'https://appleid.apple.com/auth/token',
    scope: 'name email', responseMode: 'form_post'
  }
};

function providerConfig(name) {
  const config = providers[name];
  if (!config) throw new AppError(404, 'Proveedor de identidad no reconocido.');
  if (!config.clientId || !config.clientSecret) throw new AppError(503, `${name} todavía no está configurado en el archivo .env.`);
  return config;
}

export function listProviders() {
  return Object.entries(providers).map(([name, config]) => ({ name, enabled: Boolean(config.clientId && config.clientSecret) }));
}

export async function buildAuthorizationUrl(name) {
  const config = providerConfig(name);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: callback(name),
    response_type: 'code',
    scope: config.scope,
    state: await createOAuthState(name)
  });
  if (config.responseMode) params.set('response_mode', config.responseMode);
  return `${config.authorize}?${params}`;
}

async function exchangeCode(name, code) {
  const config = providerConfig(name);
  const response = await fetch(config.token, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code', code, redirect_uri: callback(name),
      client_id: config.clientId, client_secret: config.clientSecret
    })
  });
  const body = await response.json();
  if (!response.ok || body.error) throw new AppError(401, 'El proveedor no pudo validar el acceso.', body.error_description);
  return body;
}

async function githubEmail(accessToken) {
  const response = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Pedidos360' }
  });
  const emails = response.ok ? await response.json() : [];
  return emails.find((item) => item.primary && item.verified)?.email ?? emails.find((item) => item.verified)?.email;
}

async function fetchProfile(name, tokens) {
  if (name === 'apple') {
    const jwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
    const { payload } = await jwtVerify(tokens.id_token, jwks, { issuer: 'https://appleid.apple.com', audience: env.APPLE_CLIENT_ID });
    return { id: payload.sub, name: payload.email?.split('@')[0] ?? 'Usuario Apple', email: payload.email };
  }

  const config = providerConfig(name);
  const response = await fetch(config.userInfo, {
    headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json', 'User-Agent': 'Pedidos360' }
  });
  if (!response.ok) throw new AppError(401, 'No fue posible obtener el perfil del proveedor.');
  const data = await response.json();

  if (name === 'github') return { id: String(data.id), name: data.name ?? data.login, email: data.email ?? await githubEmail(tokens.access_token), avatarUrl: data.avatar_url };
  if (name === 'microsoft') return { id: data.id, name: data.displayName, email: data.mail ?? data.userPrincipalName };
  if (name === 'facebook') return { id: data.id, name: data.name, email: data.email, avatarUrl: data.picture?.data?.url };
  return { id: data.sub, name: data.name, email: data.email, avatarUrl: data.picture };
}

// Une la cuenta social con un usuario existente por correo o crea uno nuevo.
export async function completeOAuth(name, code, state) {
  if (!(await verifyOAuthState(state, name))) throw new AppError(401, 'El estado OAuth no es válido.');
  const profile = await fetchProfile(name, await exchangeCode(name, code));
  if (!profile.id || !profile.email) throw new AppError(422, 'El proveedor no entregó un correo verificable.');

  const linked = await findOAuthAccount(name, profile.id);
  if (linked) return linked;

  return withTransaction(async (client) => {
    let user = await findUserByEmail(profile.email, client);
    if (!user) {
      user = await createUser({ id: crypto.randomUUID(), name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl }, client);
      await client.query('INSERT INTO carts (id, user_id) VALUES ($1, $2)', [crypto.randomUUID(), user.id]);
    }
    await linkOAuthAccount(user.id, name, profile.id, client);
    return user;
  });
}
