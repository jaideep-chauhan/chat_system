export type ChatType = 'direct' | 'group';

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string | null;
  createdBy: number;
  createdAt: Date;
}

export interface ChatWithMembers extends Chat {
  memberIds: number[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: number;
  text: string;
  createdAt: string;
  editedAt: string | null;
  isDeleted: boolean;
  // userId -> time the user read the message
  readBy: Record<string, string>;
}

export interface LastSeen {
  userId: number;
  messageId: string;
  updatedAt: string;
}
