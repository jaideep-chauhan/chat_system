# Chat Backend

Chat backend built with Node.js, TypeScript, PostgreSQL and Firebase Firestore.

- Users, chats and chat members live in PostgreSQL
- Messages, read receipts and last seen live in Firestore

## Setup

Requirements: Node 18+, PostgreSQL 13+, a Firebase project with Firestore enabled.

```bash
npm install
cp .env.example .env
```

1. Create a database and put its connection string in `DATABASE_URL`.
   ```bash
   createdb chat_app
   ```
2. In the Firebase console go to Project settings > Service accounts > Generate new private key.
   Save the file as `serviceAccountKey.json` in the project root and set `FIREBASE_PROJECT_ID`.
3. Create the tables and a few test users (ids 1 to 4):
   ```bash
   npm run db:init
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

For production: `npm run build && npm start`.

To use the Firestore emulator instead of a real project, set `FIRESTORE_EMULATOR_HOST` in `.env`.
The service account file is not needed in that case.

## Project structure

```
db/                  schema and seed sql
src/
  config/            env, postgres pool, firebase init
  routes/            route definitions
  controllers/       request parsing and responses
  services/          business logic (postgres + firestore)
  validators/        zod schemas
  middlewares/       error handling
  types/             shared interfaces
  utils/
  app.ts
  server.ts
```

## Data model

**PostgreSQL**

| Table | Columns |
| --- | --- |
| users | id, name, email, created_at |
| chats | id (uuid), type (direct/group), name, direct_key, created_by, created_at |
| chat_members | chat_id, user_id, role (admin/member), joined_at |

`direct_key` is `<smallerUserId>_<largerUserId>` with a unique constraint, so two users
always get the same 1:1 chat even if both call create at the same time.

**Firestore**

```
chats/{chatId}/messages/{messageId}
  senderId, text, createdAt, editedAt, isDeleted, readBy: { [userId]: timestamp }

chats/{chatId}/lastSeen/{userId}
  messageId, updatedAt
```

`chatId` is the Postgres chat id. Timestamps are Firestore server timestamps.

## API

All responses look like `{ "success": true, "data": ... }` or `{ "success": false, "message": "..." }`.

| Method | Endpoint | Body |
| --- | --- | --- |
| POST | `/chat/create` | `userAId`, `userBId` |
| POST | `/chat/:chatId/message/send` | `senderId`, `text` |
| GET | `/chat/:chatId/messages?limit=50&before=<messageId>` | |
| POST | `/chat/:chatId/message/:messageId/read` | `userId` |
| POST | `/chat/:chatId/lastseen` | `userId`, `messageId` |
| GET | `/user/:userId/chats` | |
| POST | `/user/create` | `name`, `email` |

Bonus:

| Method | Endpoint | Body |
| --- | --- | --- |
| POST | `/chat/group/create` | `name`, `creatorId`, `memberIds` |
| POST | `/chat/:chatId/members` | `userId` (admin), `memberId` |
| DELETE | `/chat/:chatId/members/:memberId` | `userId` (admin) |
| PATCH | `/chat/:chatId/message/:messageId` | `senderId`, `text` |
| DELETE | `/chat/:chatId/message/:messageId` | `senderId` |

### Examples

```bash
curl -X POST localhost:3000/chat/create \
  -H "Content-Type: application/json" \
  -d '{"userAId": 1, "userBId": 2}'

curl -X POST localhost:3000/chat/<chatId>/message/send \
  -H "Content-Type: application/json" \
  -d '{"senderId": 1, "text": "hello"}'

curl "localhost:3000/chat/<chatId>/messages?limit=50"

curl -X POST localhost:3000/chat/<chatId>/message/<messageId>/read \
  -H "Content-Type: application/json" \
  -d '{"userId": 2}'

curl -X POST localhost:3000/chat/<chatId>/lastseen \
  -H "Content-Type: application/json" \
  -d '{"userId": 2, "messageId": "<messageId>"}'

curl localhost:3000/user/1/chats
```

## Notes

- Messages are returned oldest first. `limit` returns the latest N messages, pass `before`
  with the oldest message id you have to load the previous page.
- Only chat members can send, read or update last seen. This is checked against Postgres
  before touching Firestore.
- Delete is a soft delete, the message stays in the list with `isDeleted: true` and empty text.
- There is no authentication, user ids come in the request as the task describes. In a real
  app they would come from a JWT.
