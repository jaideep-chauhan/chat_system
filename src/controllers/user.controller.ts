import { Request, Response } from 'express';
import * as chatService from '../services/chat.service';
import * as userService from '../services/user.service';
import { createUserBody, userParams } from '../validators/chat.validator';

export const createUser = async (req: Request, res: Response) => {
  const { name, email } = createUserBody.parse(req.body);
  const user = await userService.createUser(name, email);
  res.status(201).json({ success: true, data: user });
};

export const listUserChats = async (req: Request, res: Response) => {
  const { userId } = userParams.parse(req.params);
  const chats = await chatService.listUserChats(userId);
  res.json({ success: true, data: chats });
};
