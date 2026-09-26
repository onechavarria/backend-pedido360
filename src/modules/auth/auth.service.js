import crypto from 'node:crypto';
import { pool, query, withTransaction } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { hashPassword, verifyPassword } from '../../shared/security/password.js';
import { createAccessToken, hashToken, randomToken } from '../../shared/security/tokens.js';
import { createUser, findUserByEmail, findUserById, toPublicUser } from '../users/user.repository.js';

const refreshExpiresAt = () => new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86_400_000);

// Crea la cuenta local y su carrito dentro de una misma transacción.
export async function register(data) {
  if (await findUserByEmail(data.email)) throw new AppError(409, 'Ya existe una cuenta con ese correo.');

  const user = await withTransaction(async (client) => {
    const created = await createUser({
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password)
    }, client);
    await client.query('INSERT INTO carts (id, user_id) VALUES (?, ?)', [crypto.randomUUID(), created.id]);
    return created;
  });

  return issueSession(user);
}

// Compara la contraseña con BCrypt antes de emitir una sesión.
export async function login(data) {
  const user = await findUserByEmail(data.email);
  if (!user?.password_hash || !(await verifyPassword(data.password, user.password_hash))) {
    throw new AppError(401, 'Correo o contraseña incorrectos.');
  }
  return issueSession(user);
}

export async function issueSession(user) {
  const refreshToken = randomToken();
  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [crypto.randomUUID(), user.id, hashToken(refreshToken), refreshExpiresAt()]
  );

  return {
    accessToken: await createAccessToken(toPublicUser(user)),
    refreshToken,
    user: toPublicUser(user)
  };
}

// Rota el refresh token: el token anterior deja de funcionar inmediatamente.
export async function refreshSession(rawToken) {
  if (!rawToken) throw new AppError(401, 'No existe una sesión renovable.');

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP(3)
       FOR UPDATE`,
      [hashToken(rawToken)]
    );
    const stored = rows[0];
    if (!stored) throw new AppError(401, 'La sesión venció. Inicia sesión nuevamente.');

    await client.query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP(3) WHERE id = ?', [stored.id]);
    const user = await findUserById(stored.user_id, client);

    const nextRefresh = randomToken();
    await client.query(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [crypto.randomUUID(), user.id, hashToken(nextRefresh), refreshExpiresAt()]
    );
    return { accessToken: await createAccessToken(toPublicUser(user)), refreshToken: nextRefresh, user: toPublicUser(user) };
  });
}

export async function revokeSession(rawToken) {
  if (rawToken) await query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP(3) WHERE token_hash = ?', [hashToken(rawToken)]);
}

// El código OAuth solo puede canjearse una vez y vence en cinco minutos.
export async function createAuthCode(userId) {
  const code = randomToken();
  await query(
    'INSERT INTO auth_codes (code_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 5 MINUTE))',
    [hashToken(code), userId]
  );
  return code;
}

export async function exchangeAuthCode(code) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT user_id FROM auth_codes
       WHERE code_hash = ? AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP(3)
       FOR UPDATE`,
      [hashToken(code)]
    );
    if (!rows[0]) throw new AppError(401, 'El código de acceso no es válido o ya fue usado.');
    await client.query(
      'UPDATE auth_codes SET consumed_at = CURRENT_TIMESTAMP(3) WHERE code_hash = ?',
      [hashToken(code)]
    );
    const user = await findUserById(rows[0].user_id, client);

    // Se crea la sesión manualmente usando el mismo cliente de la transacción.
    const refreshToken = randomToken();
    await client.query(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [crypto.randomUUID(), user.id, hashToken(refreshToken), refreshExpiresAt()]
    );
    return { accessToken: await createAccessToken(toPublicUser(user)), refreshToken, user: toPublicUser(user) };
  });
}

export async function closeDatabase() {
  await pool.end();
}
