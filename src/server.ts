import app from './app';
import { pool } from './config/db';
import { env } from './config/env';

const start = async () => {
  await pool.query('SELECT 1');
  console.log('Postgres connected');

  const server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
