const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  });

const verifyToken = (token) => jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });

module.exports = { signToken, verifyToken };
