export const ROLE_LABELS = {
  student: 'Student',
  thesis_student: 'Thesis Student',
  researcher: 'Researcher',
  professor: 'Professor / Supervisor',
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export const initials = (name = '') =>
  name
    .replace(/^(dr|prof)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

/** Deterministic pastel hue for avatar fallbacks */
export const hueFromString = (s = '') => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '';

export const scoreLabel = (score) => {
  if (score >= 70) return 'Excellent match';
  if (score >= 45) return 'Strong match';
  if (score >= 25) return 'Good match';
  return 'Related';
};
