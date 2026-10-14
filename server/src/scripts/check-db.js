/**
 * MongoDB connection doctor:  npm run check-db
 * Finds out exactly why the API cannot reach MongoDB (DNS, blocked port,
 * IP allow-list, wrong password...). Never prints your password.
 */
require('dns').setServers((process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1').split(',').map((s) => s.trim()));
const dns = require('dns').promises;
const net = require('net');
const https = require('https');
const mongoose = require('mongoose');
const env = require('../config/env');

const ok = (m) => console.log(`  \x1b[32m✔\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✘\x1b[0m ${m}`);
const info = (m) => console.log(`  • ${m}`);

const mask = (uri) => uri.replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:****@');

function tcpCheck(host, port, timeout = 6000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, family: 4 });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeout, () => done('timeout'));
    socket.once('connect', () => done('open'));
    socket.once('error', (e) => done(e.code || e.message));
  });
}

function publicIp() {
  return new Promise((resolve) => {
    https
      .get('https://api.ipify.org', { timeout: 5000 }, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(d.trim()));
      })
      .on('error', () => resolve(null))
      .on('timeout', function onTimeout() { this.destroy(); resolve(null); });
  });
}

async function main() {
  const uri = env.mongoUri;
  console.log('\nMongoDB connection check\n------------------------');

  if (!process.env.MONGO_URI) {
    bad('MONGO_URI is not set in server/.env — using the default local address.');
  }
  info(`MONGO_URI = ${mask(uri)}`);

  const m = uri.match(/^(mongodb(?:\+srv)?):\/\/(?:([^:@/]+):([^@/]*)@)?([^/?]+)\/?([^?]*)/);
  if (!m) {
    bad('MONGO_URI is not a valid MongoDB connection string. It must start with mongodb+srv:// or mongodb://');
    return;
  }
  const [, scheme, user, pass, hostPart, dbName] = m;
  if (!user) info('No username in the URI (fine for local MongoDB, required for Atlas).');
  if (pass && /[@:/?#[\]%]/.test(decodeURIComponent(pass)) && pass === decodeURIComponent(pass)) {
    bad('Your password contains special characters that are not URL-encoded. Encode them (e.g. @ → %40) or use a letters+numbers password.');
  }
  if (pass && /^<.*>$/.test(pass)) bad('The password is still the placeholder <password>. Replace it with the real one (without < >).');
  if (!dbName) info('No database name in the URI — the default "test" database will be used. Add /research_collab before the "?".');

  const ip = await publicIp();
  info(`Your public IP address: ${ip || 'unknown (no internet?)'} — this must be allowed in Atlas → Network Access`);

  // 1) DNS
  let hosts = [];
  if (scheme === 'mongodb+srv') {
    try {
      const records = await dns.resolveSrv(`_mongodb._tcp.${hostPart}`);
      hosts = records.map((r) => ({ host: r.name, port: r.port }));
      ok(`DNS SRV lookup works (${hosts.length} servers found)`);
    } catch (e) {
      bad(`DNS SRV lookup FAILED (${e.code}). Your DNS server cannot resolve Atlas.`);
      info('Fix: set your Wi-Fi/Ethernet DNS to 8.8.8.8 and 1.1.1.1, or in Atlas choose Connect → Drivers → older Node version');
      info('to get a "mongodb://host1,host2,host3/..." string that does not need SRV lookups.');
      return;
    }
  } else {
    hosts = hostPart.split(',').map((h) => {
      const [host, port] = h.split(':');
      return { host, port: Number(port) || 27017 };
    });
  }

  // 2) TCP reachability
  let reachable = 0;
  for (const h of hosts) {
    // eslint-disable-next-line no-await-in-loop
    const r = await tcpCheck(h.host, h.port);
    if (r === 'open') {
      reachable += 1;
      ok(`Port ${h.port} reachable on ${h.host}`);
    } else {
      bad(`Cannot open port ${h.port} on ${h.host} (${r})`);
    }
  }
  if (!reachable) {
    if (/127\.0\.0\.1|localhost/.test(hostPart)) {
      bad('No MongoDB is running on this computer. Install MongoDB Community Server, or set USE_MEMORY_DB=true in .env.');
    } else {
      bad('Port 27017 is blocked on your network or by a firewall/antivirus.');
      info('Atlas cannot accept you if the connection never reaches it. Try a mobile hotspot, another network,');
      info('or set USE_MEMORY_DB=true in server/.env to run a local database instead.');
    }
    return;
  }

  // 3) Real driver connection (auth + allow-list)
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000, family: 4 });
    await mongoose.connection.db.admin().ping();
    ok(`Connected and authenticated. Database: "${mongoose.connection.name}"`);
    console.log('\n  Everything works — run: npm run dev\n');
  } catch (e) {
    const msg = e.message;
    if (/bad auth|Authentication failed/i.test(msg)) {
      bad('Network OK, but the username/password is wrong. Check Atlas → Database Access (it is NOT your Atlas login).');
    } else if (/whitelist|could not connect to any servers|ReplicaSetNoPrimary|timed out/i.test(msg)) {
      bad('Port is open but Atlas refused you: your IP is not in Network Access, or the cluster is paused.');
      info(`Add ${ip || 'your IP'} (or 0.0.0.0/0) in Atlas → Security → Network Access, wait until "Active", then retry.`);
      info('Also open Atlas → Database and click "Resume" if the cluster is paused.');
    } else {
      bad(`Connection failed: ${msg.split('\n')[0]}`);
    }
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => setTimeout(() => process.exit(0), 100));
