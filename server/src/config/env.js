require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/research_collab').trim(),
  useMemoryDb: String(process.env.USE_MEMORY_DB).toLowerCase() === 'true',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

env.isProd = env.nodeEnv === 'production';

// Fail fast on insecure configuration (Security NFR)
if (!env.jwtSecret || env.jwtSecret.length < 32) {
  if (env.isProd) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long in production.');
  }
  env.jwtSecret = env.jwtSecret || 'dev_only_insecure_secret_please_change_me_123456';
  console.warn('[config] Using a development JWT secret. Set JWT_SECRET in .env before deploying.');
}

module.exports = env;
