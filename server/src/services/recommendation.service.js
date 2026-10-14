/**
 * FR-04 — Collaborator recommendation engine.
 *
 * Content-based matching. For every candidate researcher we compare four
 * profile facets with the current user:
 *
 *   research domains 40%  ·  skills 30%  ·  interests 20%  ·  expertise 10%
 *
 * Facet similarity = max( exact-term cosine , 0.5 × word-token cosine )
 *   - exact-term cosine:  |A ∩ B| / sqrt(|A|·|B|)
 *   - token cosine lets "Deep Learning" partially match "Machine Learning"
 *
 * Facets the current user has left empty are ignored and the remaining
 * weights are re-normalised, so a user with only interests still gets
 * meaningful results. A small bonus is given for collaborators who are open
 * to collaborate and for researchers at the same institution.
 */
const User = require('../models/User');
const { normalize, tokenize } = require('../utils/text');
const events = require('../utils/events');

const WEIGHTS = { researchDomains: 0.4, skills: 0.3, interests: 0.2, expertise: 0.1 };
const FACETS = Object.keys(WEIGHTS);
const CANDIDATE_LIMIT = 1500;
const CACHE_TTL_MS = 60 * 1000;

// ---- tiny in-memory cache (Performance NFR) ----
const cache = new Map();
const invalidate = (userId) => cache.delete(String(userId));
const clearAll = () => cache.clear();

// Any profile/skill change can change everybody's ranking -> drop the cache
events.on('profile:changed', clearAll);

const setCosine = (a, b) => {
  if (!a.length || !b.length) return 0;
  const A = new Set(a);
  const shared = [...new Set(b)].filter((x) => A.has(x)).length;
  return shared / Math.sqrt(new Set(a).size * new Set(b).size);
};

const facetValues = (u, facet) =>
  facet === 'skills' ? (u.skills || []).map((s) => s.name) : u[facet] || [];

/** Build the comparable "fingerprint" of a profile. */
function fingerprint(u) {
  const fp = {};
  FACETS.forEach((f) => {
    const labels = facetValues(u, f);
    fp[f] = { labels, norm: labels.map(normalize), tokens: tokenize(labels) };
  });
  fp.institution = normalize(u.institution);
  return fp;
}

/** Score one candidate against the base profile. Returns null if no overlap. */
function scoreCandidate(base, candidate) {
  const cand = fingerprint(candidate);
  let weighted = 0;
  let activeWeight = 0;
  const breakdown = {};
  const shared = {};

  FACETS.forEach((f) => {
    if (!base[f].norm.length) return;
    activeWeight += WEIGHTS[f];
    const exact = setCosine(base[f].norm, cand[f].norm);
    const fuzzy = 0.5 * setCosine(base[f].tokens, cand[f].tokens);
    const sim = Math.max(exact, fuzzy);
    weighted += WEIGHTS[f] * sim;
    breakdown[f] = Math.round(sim * 100);

    const baseSet = new Set(base[f].norm);
    shared[f] = cand[f].labels.filter((label) => baseSet.has(normalize(label)));
  });

  if (!activeWeight || weighted === 0) return null;

  let score = weighted / activeWeight;
  if (base.institution && base.institution === cand.institution) score += 0.03;
  if (candidate.settings && candidate.settings.openToCollaborate === false) score *= 0.85;
  score = Math.min(1, score);

  const reasons = [];
  if (shared.researchDomains && shared.researchDomains.length)
    reasons.push(`Works in ${shared.researchDomains.slice(0, 2).join(' & ')}`);
  if (shared.skills && shared.skills.length)
    reasons.push(`${shared.skills.length} shared skill${shared.skills.length > 1 ? 's' : ''}`);
  if (shared.interests && shared.interests.length)
    reasons.push(`Interested in ${shared.interests.slice(0, 2).join(', ')}`);
  if (!reasons.length) reasons.push('Related research topics');
  if (base.institution && base.institution === cand.institution) reasons.push('Same institution');

  return { score: Math.round(score * 100), breakdown, shared, reasons };
}

/**
 * Recommend collaborators for `baseUser`.
 * @returns {{ items: Array, total: number, page: number, pages: number, hasProfileData: boolean }}
 */
async function recommendFor(baseUser, { page = 1, limit = 12, minScore = 5, role } = {}) {
  const base = fingerprint(baseUser);
  const hasProfileData = FACETS.some((f) => base[f].norm.length);
  if (!hasProfileData) return { items: [], total: 0, page: 1, pages: 0, hasProfileData };

  const cacheKey = String(baseUser._id);
  let ranked;
  const hit = cache.get(cacheKey);

  if (hit && hit.expires > Date.now()) {
    ranked = hit.ranked;
  } else {
    // Pre-filter in MongoDB using the indexed normalised arrays so we only
    // score people who share at least one term or word token.
    const baseTokens = tokenize(FACETS.flatMap((f) => base[f].labels));
    const or = [];
    FACETS.forEach((f) => {
      if (base[f].norm.length) or.push({ [`norm.${f}`]: { $in: base[f].norm } });
    });
    if (baseTokens.length) or.push({ 'norm.tokens': { $in: baseTokens } });

    const candidates = await User.find({ _id: { $ne: baseUser._id }, isActive: true, $or: or })
      .select('name role headline institution department designation avatar.updatedAt researchDomains skills interests expertise settings')
      .limit(CANDIDATE_LIMIT)
      .lean();

    ranked = candidates
      .map((c) => {
        const result = scoreCandidate(base, c);
        return result ? { researcher: User.toCard(c), ...result } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.researcher.name.localeCompare(b.researcher.name));

    cache.set(cacheKey, { ranked, expires: Date.now() + CACHE_TTL_MS });
  }

  const filtered = ranked.filter(
    (r) => r.score >= minScore && (!role || r.researcher.role === role)
  );
  const total = filtered.length;
  const start = (page - 1) * limit;
  return {
    items: filtered.slice(start, start + limit),
    total,
    page,
    pages: Math.ceil(total / limit),
    hasProfileData,
  };
}

module.exports = { recommendFor, scoreCandidate, fingerprint, invalidate, clearAll, WEIGHTS };
