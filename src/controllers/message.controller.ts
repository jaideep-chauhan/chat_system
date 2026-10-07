import { Request, Response } from 'express';
import * as chatService from '../services/chat.service';
import * as messageService from '../services/message.service';
import {
  chatParams,
  deleteMessageBody,
  getMessagesQuery,
  lastSeenBody,
  messageParams,
  sendMessageBody,
  userBody,
} from '../validators/chat.validator';

export const sendMessage = async (req: Request, res: Response) => {
  const { chatId } = chatParams.parse(req.params);
  const { senderId, text } = sendMessageBody.parse(req.body);

  await chatService.assertMember(chatId, senderId);
  const message = await messageService.sendMessage(chatId, senderId, text);
  res.status(201).json({ success: true, data: message });
};

export const getMessages = async (req: Request, res: Response) => {
  const { chatId } = chatParams.parse(req.params);
  const { limit, before } = getMessagesQuery.parse(req.query);

  await chatService.getChat(chatId);
  const messages = await messageService.getMessages(chatId, limit, before);
  res.json({ success: true, data: messages });
};

export const markRead = async (req: Request, res: Response) => {
  const { chatId, messageId } = messageParams.parse(req.params);
  const { userId } = userBody.parse(req.body);

  await chatService.assertMember(chatId, userId);
  const message = await messageService.markMessageRead(chatId, messageId, userId);
  res.json({ success: true, data: message });
};

export const updateLastSeen = async (req: Request, res: Response) => {
  const { chatId } = chatParams.parse(req.params);
  const { userId, messageId } = lastSeenBody.parse(req.body);

  await chatService.assertMember(chatId, userId);
  const lastSeen = await messageService.updateLastSeen(chatId, userId, messageId);
  res.json({ success: true, data: lastSeen });
};

export const editMessage = async (req: Request, res: Response) => {
  const { chatId, messageId } = messageParams.parse(req.params);
  const { senderId, text } = sendMessageBody.parse(req.body);

  await chatService.assertMember(chatId, senderId);
  const message = await messageService.editMessage(chatId, messageId, senderId, text);
  res.json({ success: true, data: message });
};

export const deleteMessage = async (req: Request, res: Response) => {
  const { chatId, messageId } = messageParams.parse(req.params);
  const { senderId } = deleteMessageBody.parse(req.body);

  await chatService.assertMember(chatId, senderId);
  await messageService.deleteMessage(chatId, messageId, senderId);
  res.json({ success: true, message: 'Message deleted' });
};
