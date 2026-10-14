const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const sanitize = require('./middleware/sanitize');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1); // behind Render's proxy -> correct client IP for rate limiting
app.disable('x-powered-by');

// ---- Security headers & CORS ----
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin / server-to-server (no Origin header) and whitelisted frontends
      if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
);

// ---- Performance ----
app.use(compression());

// ---- Body parsing with size limits ----
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(sanitize);

if (!env.isProd) app.use(morgan('dev'));
else app.use(morgan('combined'));

// General API rate limit (protects availability)
app.use(
  '/api',
  rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false })
);

app.get('/', (req, res) => res.json({ name: 'Research Collaboration Platform API', version: '1.0.0' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
