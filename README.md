# Chat System

Chat backend using Node.js, TypeScript, PostgreSQL and Firebase Firestore.

- Users and chats are stored in PostgreSQL
- Messages, read receipts and last seen are stored in Firestore

## Setup

1. Install packages

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and update the values

   ```bash
   cp .env.example .env
   ```

3. Create the database

   ```bash
   createdb chat_app
   ```

4. Download the service account key from Firebase console
   (Project settings > Service accounts > Generate new private key)
   and save it as `serviceAccountKey.json` in the project root.

5. Create tables and test users

   ```bash
   npm run db:init
   ```

6. Start the server

   ```bash
   npm run dev
   ```

Server runs on `http://localhost:3000`. Test users with id 1 to 4 are added by step 5.

## APIs

| Method | Endpoint | Body |
| --- | --- | --- |
| POST | `/chat/create` | `userAId`, `userBId` |
| POST | `/chat/:chatId/message/send` | `senderId`, `text` |
| GET | `/chat/:chatId/messages?limit=50` | |
| POST | `/chat/:chatId/message/:messageId/read` | `userId` |
| POST | `/chat/:chatId/lastseen` | `userId`, `messageId` |
| GET | `/user/:userId/chats` | |

Bonus

| Method | Endpoint | Body |
| --- | --- | --- |
| POST | `/chat/group/create` | `name`, `creatorId`, `memberIds` |
| POST | `/chat/:chatId/members` | `userId`, `memberId` |
| DELETE | `/chat/:chatId/members/:memberId` | `userId` |
| PATCH | `/chat/:chatId/message/:messageId` | `senderId`, `text` |
| DELETE | `/chat/:chatId/message/:messageId` | `senderId` |

## Example

```bash
curl -X POST localhost:3000/chat/create \
  -H "Content-Type: application/json" \
  -d '{"userAId": 1, "userBId": 2}'

curl -X POST localhost:3000/chat/<chatId>/message/send \
  -H "Content-Type: application/json" \
  -d '{"senderId": 1, "text": "hello"}'
```

## Folder structure

```
db/            sql files
src/
  config/      db and firebase setup
  routes/
  controllers/
  services/
  validators/
  middlewares/
  types/
```

## Notes

- Messages are returned oldest first.
- Only chat members can send or read messages.
- Deleted messages are soft deleted.
- No authentication is added, user ids are passed in the request.
