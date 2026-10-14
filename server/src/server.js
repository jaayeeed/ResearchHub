const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const app = require('./app');
const User = require('./models/User');

let server;

async function start() {
  await connectDB();

  // Local database mode: add demo researchers automatically the first time
  if (env.useMemoryDb && (await User.estimatedDocumentCount()) === 0) {
    const { seedDemo } = require('./scripts/seed');
    await seedDemo();
  }

  server = app.listen(env.port, () => {
    console.log(`[server] API running on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

// Graceful shutdown so in-flight requests finish and the DB closes cleanly (Reliability NFR)
async function shutdown(signal) {
  console.log(`[server] ${signal} received, shutting down...`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.once('SIGUSR2', async () => {
  // nodemon restart: release the local DB lock before restarting
  await disconnectDB();
  process.kill(process.pid, 'SIGUSR2');
});
process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled rejection:', err);
});

start().catch((err) => {
  console.error('[server] Failed to start:', err.message.split('\n')[0]);
  process.exit(1);
});
