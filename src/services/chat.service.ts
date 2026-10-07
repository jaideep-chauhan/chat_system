import { pool } from '../config/db';
import { Chat, ChatWithMembers } from '../types';
import { ApiError } from '../utils/ApiError';
import { assertUsersExist } from './user.service';

const CHAT_COLUMNS = 'c.id, c.type, c.name, c.created_by AS "createdBy", c.created_at AS "createdAt"';

export const createOrGetDirectChat = async (userAId: number, userBId: number) => {
  if (userAId === userBId) throw ApiError.badRequest('Cannot create a chat with yourself');
  await assertUsersExist([userAId, userBId]);

  // same key regardless of who starts the chat
  const directKey = `${Math.min(userAId, userBId)}_${Math.max(userAId, userBId)}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO chats (type, direct_key, created_by)
       VALUES ('direct', $1, $2)
       ON CONFLICT (direct_key) DO NOTHING
       RETURNING id`,
      [directKey, userAId],
    );

    if (!inserted.rowCount) {
      await client.query('ROLLBACK');
      const existing = await pool.query<{ id: string }>('SELECT id FROM chats WHERE direct_key = $1', [directKey]);
      return { chatId: existing.rows[0]!.id, isNew: false };
    }

    const chatId = inserted.rows[0]!.id;
    await client.query('INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2), ($1, $3)', [
      chatId,
      userAId,
      userBId,
    ]);

    await client.query('COMMIT');
    return { chatId, isNew: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const createGroupChat = async (name: string, creatorId: number, memberIds: number[]) => {
  const members = [...new Set(memberIds)].filter((id) => id !== creatorId);
  if (!members.length) throw ApiError.badRequest('Group needs at least one member other than the creator');
  await assertUsersExist([creatorId, ...members]);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO chats (type, name, created_by) VALUES ('group', $1, $2) RETURNING id`,
      [name, creatorId],
    );
    const chatId = rows[0]!.id;

    await client.query(`INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, 'admin')`, [
      chatId,
      creatorId,
    ]);
    await client.query(
      `INSERT INTO chat_members (chat_id, user_id)
       SELECT $1, UNNEST($2::int[])`,
      [chatId, members],
    );

    await client.query('COMMIT');
    return { chatId, memberIds: [creatorId, ...members] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getChat = async (chatId: string): Promise<Chat> => {
  const { rows } = await pool.query<Chat>(`SELECT ${CHAT_COLUMNS} FROM chats c WHERE c.id = $1`, [chatId]);
  if (!rows[0]) throw ApiError.notFound('Chat not found');
  return rows[0];
};

export const assertMember = async (chatId: string, userId: number): Promise<void> => {
  await getChat(chatId);

  const { rowCount } = await pool.query('SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2', [
    chatId,
    userId,
  ]);
  if (!rowCount) throw ApiError.forbidden('User is not a member of this chat');
};

const assertGroupAdmin = async (chatId: string, userId: number): Promise<void> => {
  const chat = await getChat(chatId);
  if (chat.type !== 'group') throw ApiError.badRequest('Members can only be managed in group chats');

  const { rows } = await pool.query<{ role: string }>(
    'SELECT role FROM chat_members WHERE chat_id = $1 AND user_id = $2',
    [chatId, userId],
  );
  if (rows[0]?.role !== 'admin') throw ApiError.forbidden('Only a group admin can do this');
};

export const addGroupMember = async (chatId: string, adminId: number, memberId: number): Promise<void> => {
  await assertGroupAdmin(chatId, adminId);
  await assertUsersExist([memberId]);

  const { rowCount } = await pool.query(
    'INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [chatId, memberId],
  );
  if (!rowCount) throw ApiError.badRequest('User is already a member');
};

export const removeGroupMember = async (chatId: string, adminId: number, memberId: number): Promise<void> => {
  await assertGroupAdmin(chatId, adminId);
  if (adminId === memberId) throw ApiError.badRequest('Admin cannot remove themselves');

  const { rowCount } = await pool.query('DELETE FROM chat_members WHERE chat_id = $1 AND user_id = $2', [
    chatId,
    memberId,
  ]);
  if (!rowCount) throw ApiError.notFound('User is not a member of this chat');
};

export const listUserChats = async (userId: number): Promise<ChatWithMembers[]> => {
  await assertUsersExist([userId]);

  const { rows } = await pool.query<ChatWithMembers>(
    `SELECT ${CHAT_COLUMNS}, ARRAY_AGG(m.user_id ORDER BY m.user_id) AS "memberIds"
     FROM chats c
     JOIN chat_members m ON m.chat_id = c.id
     WHERE c.id IN (SELECT chat_id FROM chat_members WHERE user_id = $1)
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [userId],
  );
  return rows;
};
