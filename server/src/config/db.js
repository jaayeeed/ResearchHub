const dns = require('dns');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const env = require('./env');

// Node.js on Windows often fails Atlas "mongodb+srv" lookups with
// "querySrv ECONNREFUSED" when using the router's DNS. Use public DNS
// resolvers instead (override with DNS_SERVERS=ip1,ip2 in .env).
if (env.mongoUri.startsWith('mongodb+srv://') && !env.useMemoryDb) {
  dns.setServers((process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1').split(',').map((s) => s.trim()));
}

// Unknown fields in filters are ignored. NoSQL-injection protection is applied
// to all incoming requests by middleware/sanitize.js.
mongoose.set('strictQuery', true);

let memoryServer = null;

/**
 * USE_MEMORY_DB=true  ->  runs a real MongoDB server on this computer (via
 * mongodb-memory-server). Data is kept in server/.mongo-data, so it survives
 * restarts. Useful when Atlas is unreachable from your network.
 */
async function startLocalMongo() {
  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = require('mongodb-memory-server'));
  } catch {
    throw new Error('USE_MEMORY_DB=true needs the package: run  npm install -D mongodb-memory-server');
  }
  const dbPath = path.resolve(__dirname, '../../.mongo-data');
  fs.mkdirSync(dbPath, { recursive: true });
  console.log('[db] Starting local MongoDB (first run downloads ~100 MB, please wait)...');
  memoryServer = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: 'wiredTiger', dbName: 'research_collab' },
  });
  return memoryServer.getUri('research_collab');
}

/** Turns driver errors into an actionable hint. */
function explain(err) {
  const msg = err.message || '';
  if (/whitelist|ReplicaSetNoPrimary|Server selection timed out|could not connect to any servers/i.test(msg)) {
    return 'Atlas is unreachable. Check: (1) Network Access allows your IP or 0.0.0.0/0, (2) the cluster is not paused, (3) your network does not block port 27017 (try a mobile hotspot). Run "npm run check-db" for a full diagnosis, or set USE_MEMORY_DB=true in .env to work locally.';
  }
  if (/querySrv|ENOTFOUND|ECONNREFUSED.*_mongodb/i.test(msg)) {
    return 'DNS lookup for the Atlas cluster failed. Change your DNS to 8.8.8.8 / 1.1.1.1, or use the "standard connection string" (mongodb://...) from Atlas. Run "npm run check-db".';
  }
  if (/bad auth|Authentication failed/i.test(msg)) {
    return 'Wrong database username or password in MONGO_URI (Atlas → Database Access). URL-encode special characters in the password.';
  }
  return '';
}

/**
 * Connect to MongoDB with retries (Reliability NFR).
 */
async function connectDB({ retries = 3, delayMs = 2000 } = {}) {
  const uri = env.useMemoryDb ? await startLocalMongo() : env.mongoUri;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        maxPoolSize: 20, // Scalability: reuse connections under load
        serverSelectionTimeoutMS: 10000,
        family: 4, // prefer IPv4 — avoids slow/failed IPv6 routes on some networks
      });
      console.log(
        `[db] MongoDB connected: ${env.useMemoryDb ? 'local (USE_MEMORY_DB)' : mongoose.connection.host}/${mongoose.connection.name}`
      );
      return mongoose.connection;
    } catch (err) {
      console.error(`[db] Connection attempt ${attempt}/${retries} failed: ${err.message.split('\n')[0]}`);
      if (attempt === retries) {
        const hint = explain(err);
        if (hint) console.error(`[db] HINT: ${hint}`);
        throw err;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

async function disconnectDB() {
  await mongoose.connection.close();
  if (memoryServer) await memoryServer.stop({ doCleanup: false });
}

mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('[db] MongoDB reconnected'));

module.exports = { connectDB, disconnectDB };
