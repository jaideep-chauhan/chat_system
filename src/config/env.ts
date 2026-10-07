import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env variable: ${key}`);
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: required('DATABASE_URL'),
  firebaseProjectId: required('FIREBASE_PROJECT_ID'),
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  useFirestoreEmulator: Boolean(process.env.FIRESTORE_EMULATOR_HOST),
};
