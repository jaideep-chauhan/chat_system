import { Router } from 'express';
import * as userController from '../controllers/user.controller';

const router = Router();

router.post('/create', userController.createUser);
router.get('/:userId/chats', userController.listUserChats);

export default router;
