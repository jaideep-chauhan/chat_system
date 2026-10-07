import { z } from 'zod';

const id = z.coerce.number().int().positive();

export const chatParams = z.object({ chatId: z.uuid() });
export const messageParams = chatParams.extend({ messageId: z.string().min(1) });
export const memberParams = chatParams.extend({ memberId: id });
export const userParams = z.object({ userId: id });

export const createUserBody = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
});

export const createChatBody = z.object({ userAId: id, userBId: id });

export const createGroupBody = z.object({
  name: z.string().trim().min(1).max(100),
  creatorId: id,
  memberIds: z.array(id).min(1),
});

export const addMemberBody = z.object({ userId: id, memberId: id });
export const userBody = z.object({ userId: id });

export const sendMessageBody = z.object({
  senderId: id,
  text: z.string().trim().min(1).max(4000),
});

export const deleteMessageBody = z.object({ senderId: id });
export const lastSeenBody = z.object({ userId: id, messageId: z.string().min(1) });

export const getMessagesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().min(1).optional(),
});
