import fs from 'fs';
import path from 'path';
import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from './env';

const getCredential = () => {
  if (env.useFirestoreEmulator) return undefined;
  if (!env.firebaseServiceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is required when not using the emulator');
  }

  const file = path.resolve(env.firebaseServiceAccountPath);
  return cert(JSON.parse(fs.readFileSync(file, 'utf8')) as ServiceAccount);
};

const credential = getCredential();

const app = initializeApp({
  projectId: env.firebaseProjectId,
  ...(credential && { credential }),
});

export const firestore = getFirestore(app);
