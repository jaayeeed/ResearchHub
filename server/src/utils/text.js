/** Text helpers shared by search and recommendation logic. */

const STOP_WORDS = new Set([
  'and', 'or', 'of', 'the', 'in', 'for', 'to', 'a', 'an', 'on', 'with', 'by', 'at', 'from', 'based',
]);

/** Canonical form used for matching: lowercase, single spaces, trimmed. */
const normalize = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Clean a display value: collapse whitespace, trim, limit length. */
const cleanLabel = (s, max = 60) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);

/** De-duplicate a list of labels case-insensitively, keeping first spelling. */
function uniqueLabels(list = [], max = 60) {
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const label = cleanLabel(raw, max);
    const key = normalize(label);
    if (label && !seen.has(key)) {
      seen.add(key);
      out.push(label);
    }
  }
  return out;
}

/** Split phrases into meaningful word tokens ("Machine Learning" -> ["machine","learning"]). */
function tokenize(list = []) {
  const tokens = new Set();
  list.forEach((phrase) => {
    normalize(phrase)
      .split(/[^a-z0-9+#]+/)
      .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
      .forEach((t) => tokens.add(t));
  });
  return [...tokens];
}

/** Escape a string for safe use inside a RegExp (prevents ReDoS / regex injection). */
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { normalize, cleanLabel, uniqueLabels, tokenize, escapeRegex };
