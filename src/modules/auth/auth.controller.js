import { env } from '../../config/env.js';
import { createAuthCode, exchangeAuthCode, login, refreshSession, register, revokeSession } from './auth.service.js';
import { buildAuthorizationUrl, completeOAuth, listProviders } from './oauth.service.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: env.NODE_ENV === 'production',
  maxAge: env.REFRESH_TOKEN_DAYS * 86_400_000,
  path: '/api/v1/auth'
};

const respondWithSession = (res, session, status = 200) => {
  res.cookie('pedidos360_refresh', session.refreshToken, cookieOptions);
  res.status(status).json({ accessToken: session.accessToken, user: session.user });
};

export async function registerController(req, res) { respondWithSession(res, await register(req.body), 201); }
export async function loginController(req, res) { respondWithSession(res, await login(req.body)); }
export async function refreshController(req, res) { respondWithSession(res, await refreshSession(req.cookies.pedidos360_refresh)); }

export async function logoutController(req, res) {
  await revokeSession(req.cookies.pedidos360_refresh);
  res.clearCookie('pedidos360_refresh', cookieOptions).status(204).send();
}

export function meController(req, res) { res.json({ user: req.user }); }
export function providersController(_req, res) { res.json({ providers: listProviders() }); }

export async function oauthStartController(req, res) {
  res.redirect(await buildAuthorizationUrl(req.params.provider));
}

export async function oauthCallbackController(req, res) {
  const user = await completeOAuth(req.params.provider, req.body.code ?? req.query.code, req.body.state ?? req.query.state);
  const code = await createAuthCode(user.id);
  res.redirect(`${env.FRONTEND_URL}/auth/callback?code=${encodeURIComponent(code)}`);
}

export async function exchangeController(req, res) { respondWithSession(res, await exchangeAuthCode(req.body.code)); }

