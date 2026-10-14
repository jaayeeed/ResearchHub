/**
 * NoSQL-injection protection (Security NFR).
 * Removes any object keys that start with "$" or contain "." from the request
 * body, query string and route params, so values like { "$ne": null } can never
 * reach a MongoDB query.
 */
function clean(value, depth = 0) {
  if (depth > 10) return undefined;
  if (Array.isArray(value)) return value.map((v) => clean(v, depth + 1));
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    const out = {};
    Object.keys(value).forEach((key) => {
      if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor') return;
      out[key] = clean(value[key], depth + 1);
    });
    return out;
  }
  return value;
}

module.exports = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  if (req.query) {
    const q = clean(req.query);
    // Query values must be plain strings for our endpoints
    Object.keys(q).forEach((k) => {
      if (Array.isArray(q[k])) q[k] = String(q[k][0] ?? '');
      else if (typeof q[k] === 'object') delete q[k];
    });
    req.query = q;
  }
  next();
};
