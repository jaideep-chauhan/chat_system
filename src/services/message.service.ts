import { DocumentData, DocumentSnapshot, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { firestore } from '../config/firebase';
import { LastSeen, Message } from '../types';
import { ApiError } from '../utils/ApiError';

// Firestore layout:
//   chats/{chatId}/messages/{messageId}
//   chats/{chatId}/lastSeen/{userId}
const messagesRef = (chatId: string) => firestore.collection('chats').doc(chatId).collection('messages');
const lastSeenRef = (chatId: string) => firestore.collection('chats').doc(chatId).collection('lastSeen');

const toIso = (value: unknown): string | null => (value instanceof Timestamp ? value.toDate().toISOString() : null);

const toMessage = (chatId: string, doc: DocumentSnapshot<DocumentData>): Message => {
  const data = doc.data()!;
  const readBy: Record<string, string> = {};
  for (const [userId, readAt] of Object.entries(data.readBy ?? {})) {
    readBy[userId] = toIso(readAt) ?? '';
  }

  return {
    id: doc.id,
    chatId,
    senderId: data.senderId,
    text: data.isDeleted ? '' : data.text,
    createdAt: toIso(data.createdAt) ?? '',
    editedAt: toIso(data.editedAt),
    isDeleted: data.isDeleted,
    readBy,
  };
};

const getMessageDoc = async (chatId: string, messageId: string) => {
  const doc = await messagesRef(chatId).doc(messageId).get();
  if (!doc.exists) throw ApiError.notFound('Message not found');
  return doc;
};

export const sendMessage = async (chatId: string, senderId: number, text: string): Promise<Message> => {
  const ref = messagesRef(chatId).doc();
  await ref.set({
    senderId,
    text,
    createdAt: FieldValue.serverTimestamp(),
    editedAt: null,
    isDeleted: false,
    readBy: {},
  });

  return toMessage(chatId, await ref.get());
};

export const getMessages = async (chatId: string, limit: number, before?: string): Promise<Message[]> => {
  let query = messagesRef(chatId).orderBy('createdAt', 'desc').limit(limit);

  if (before) {
    const cursor = await getMessageDoc(chatId, before);
    query = query.startAfter(cursor);
  }

  // fetched newest first so the limit gives the latest page, returned oldest first
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => toMessage(chatId, doc)).reverse();
};

export const markMessageRead = async (chatId: string, messageId: string, userId: number): Promise<Message> => {
  const doc = await getMessageDoc(chatId, messageId);
  const data = doc.data()!;

  if (data.senderId === userId) throw ApiError.badRequest('Sender cannot mark their own message as read');

  if (!data.readBy?.[userId]) {
    await doc.ref.update({ [`readBy.${userId}`]: FieldValue.serverTimestamp() });
  }

  return toMessage(chatId, await doc.ref.get());
};

export const updateLastSeen = async (chatId: string, userId: number, messageId: string): Promise<LastSeen> => {
  await getMessageDoc(chatId, messageId);

  const ref = lastSeenRef(chatId).doc(String(userId));
  await ref.set({ messageId, updatedAt: FieldValue.serverTimestamp() });

  const saved = await ref.get();
  return { userId, messageId, updatedAt: toIso(saved.data()!.updatedAt) ?? '' };
};

const getOwnMessage = async (chatId: string, messageId: string, senderId: number) => {
  const doc = await getMessageDoc(chatId, messageId);
  const data = doc.data()!;

  if (data.senderId !== senderId) throw ApiError.forbidden('You can only modify your own messages');
  if (data.isDeleted) throw ApiError.badRequest('Message is already deleted');
  return doc;
};

export const editMessage = async (
  chatId: string,
  messageId: string,
  senderId: number,
  text: string,
): Promise<Message> => {
  const doc = await getOwnMessage(chatId, messageId, senderId);
  await doc.ref.update({ text, editedAt: FieldValue.serverTimestamp() });
  return toMessage(chatId, await doc.ref.get());
};

export const deleteMessage = async (chatId: string, messageId: string, senderId: number): Promise<void> => {
  const doc = await getOwnMessage(chatId, messageId, senderId);
  // soft delete so ordering and last seen references stay intact
  await doc.ref.update({ isDeleted: true, text: '' });
};
