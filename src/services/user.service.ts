import { pool } from '../config/db';
import { User } from '../types';
import { ApiError } from '../utils/ApiError';

const USER_COLUMNS = 'id, name, email, created_at AS "createdAt"';

export const createUser = async (name: string, email: string): Promise<User> => {
  const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (existing.rowCount) throw ApiError.badRequest('Email already in use');

  const { rows } = await pool.query<User>(
    `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING ${USER_COLUMNS}`,
    [name, email],
  );
  return rows[0]!;
};

export const assertUsersExist = async (userIds: number[]): Promise<void> => {
  const ids = [...new Set(userIds)];
  const { rows } = await pool.query<{ id: number }>('SELECT id FROM users WHERE id = ANY($1::int[])', [ids]);

  const found = new Set(rows.map((r) => r.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length) throw ApiError.notFound(`User not found: ${missing.join(', ')}`);
};
