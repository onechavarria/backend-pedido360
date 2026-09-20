import { query } from '../../config/database.js';

// El repositorio contiene solamente SQL del módulo de usuarios.
export async function findUserByEmail(email, client = { query }) {
  const { rows } = await client.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  return rows[0] ?? null;
}

export async function findUserById(id, client = { query }) {
  const { rows } = await client.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function createUser(user, client = { query }) {
  const { rows } = await client.query(
    `INSERT INTO users (id, name, email, password_hash, avatar_url)
     VALUES ($1, $2, LOWER($3), $4, $5)
     RETURNING *`,
    [user.id, user.name, user.email, user.passwordHash ?? null, user.avatarUrl ?? null]
  );
  return rows[0];
}

export async function findOAuthAccount(provider, providerUserId, client = { query }) {
  const { rows } = await client.query(
    `SELECT u.* FROM oauth_accounts oa
     JOIN users u ON u.id = oa.user_id
     WHERE oa.provider = $1 AND oa.provider_user_id = $2`,
    [provider, providerUserId]
  );
  return rows[0] ?? null;
}

export async function linkOAuthAccount(userId, provider, providerUserId, client = { query }) {
  await client.query(
    `INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
     VALUES ($1, $2, $3) ON CONFLICT (provider, provider_user_id) DO NOTHING`,
    [userId, provider, providerUserId]
  );
}

// Nunca se expone password_hash en las respuestas HTTP.
export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatar_url
  };
}

