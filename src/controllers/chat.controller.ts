import { Request, Response } from 'express';
import * as chatService from '../services/chat.service';
import {
  addMemberBody,
  chatParams,
  createChatBody,
  createGroupBody,
  memberParams,
  userBody,
} from '../validators/chat.validator';

export const createChat = async (req: Request, res: Response) => {
  const { userAId, userBId } = createChatBody.parse(req.body);
  const { chatId, isNew } = await chatService.createOrGetDirectChat(userAId, userBId);
  res.status(isNew ? 201 : 200).json({ success: true, data: { chatId } });
};

export const createGroup = async (req: Request, res: Response) => {
  const { name, creatorId, memberIds } = createGroupBody.parse(req.body);
  const group = await chatService.createGroupChat(name, creatorId, memberIds);
  res.status(201).json({ success: true, data: group });
};

export const addMember = async (req: Request, res: Response) => {
  const { chatId } = chatParams.parse(req.params);
  const { userId, memberId } = addMemberBody.parse(req.body);
  await chatService.addGroupMember(chatId, userId, memberId);
  res.status(201).json({ success: true, message: 'Member added' });
};

export const removeMember = async (req: Request, res: Response) => {
  const { chatId, memberId } = memberParams.parse(req.params);
  const { userId } = userBody.parse(req.body);
  await chatService.removeGroupMember(chatId, userId, memberId);
  res.json({ success: true, message: 'Member removed' });
};
