import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import * as messageController from '../controllers/message.controller';

const router = Router();

router.post('/create', chatController.createChat);
router.post('/group/create', chatController.createGroup);
router.post('/:chatId/members', chatController.addMember);
router.delete('/:chatId/members/:memberId', chatController.removeMember);

router.post('/:chatId/message/send', messageController.sendMessage);
router.get('/:chatId/messages', messageController.getMessages);
router.post('/:chatId/message/:messageId/read', messageController.markRead);
router.patch('/:chatId/message/:messageId', messageController.editMessage);
router.delete('/:chatId/message/:messageId', messageController.deleteMessage);
router.post('/:chatId/lastseen', messageController.updateLastSeen);

export default router;
