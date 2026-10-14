import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResearcherAPI, errorMessage } from '../api/client';
import Icon from '../components/Icon';
import ResearcherCard from '../components/ResearcherCard';
import { CardSkeleton, EmptyState, Pagination } from '../components/Feedback';
import useDebounce from '../hooks/useDebounce';
import { ROLE_LABELS, ROLE_OPTIONS } from '../utils/format';

const LIST_KEYS = ['domain', 'skill', 'interest'];

function FacetGroup({ title, items = [], selected, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return null;
  const shown = expanded ? items : items.slice(0, 6);
  return (
    <div className="facet">
      <h4>{title}</h4>
      <ul>
        {shown.map((it) => {
          const on = selected.includes(it.label.toLowerCase());
          return (
            <li key={it.label}>
              <button type="button" className={`facet__item ${on ? 'is-on' : ''}`} onClick={() => onToggle(it.label)} aria-pressed={on}>
                <span className="facet__check">{on && <Icon name="check" size={11} strokeWidth={3} />}</span>
                <span className="facet__label">{it.label}</span>
                <small>{it.count}</small>
              </button>
            </li>
          );
        })}
      </ul>
      {items.length > 6 && (
        <button type="button" className="link-btn" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Show less' : `Show ${items.length - 6} more`}
        </button>
      )}
    </div>
  );
}

export default function Discover() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const debouncedQ = useDebounce(q, 350);
  const [facets, setFacets] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const page = Number(params.get('page')) || 1;
  const role = params.get('role') || '';
  const institution = params.get('institution') || '';
  const sort = params.get('sort') || 'relevance';
  const paramsKey = params.toString(); // stable dependency for effects
  const lists = useMemo(
    () => Object.fromEntries(LIST_KEYS.map((k) => [k, (params.get(k) || '').split(',').filter(Boolean)])),
    [paramsKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const update = (changes, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  // keep ?q= in sync with the (debounced) search box
  useEffect(() => {
    if ((params.get('q') || '') !== debouncedQ) update({ q: debouncedQ });
  }, [debouncedQ]); // eslint-disable-line react-hooks/exhaustive-deps

  // topbar search navigates here with a new ?q=
  useEffect(() => {
    const urlQ = params.get('q') || '';
    if (urlQ !== q && urlQ !== debouncedQ) setQ(urlQ);
  }, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    ResearcherAPI.filters().then(setFacets).catch(() => setFacets({}));
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    const query = { page, limit: 12, sort };
    ['q', 'role', 'institution', ...LIST_KEYS].forEach((k) => {
      const v = params.get(k);
      if (v) query[k] = v;
    });
    ResearcherAPI.search(query, ctrl.signal)
      .then((d) => {
        setResult(d);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'CanceledError') return;
        setError(errorMessage(err));
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleList = (key, label) => {
    const v = label.toLowerCase();
    const cur = lists[key];
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    update({ [key]: next.join(',') });
  };

  const activeChips = [
    ...LIST_KEYS.flatMap((k) => lists[k].map((v) => ({ key: k, value: v, label: v }))),
    ...(role ? [{ key: 'role', value: role, label: ROLE_LABELS[role] }] : []),
    ...(institution ? [{ key: 'institution', value: institution, label: institution }] : []),
  ];
  const clearAll = () => {
    setQ('');
    setParams(new URLSearchParams(), { replace: true });
  };
  const highlight = [q, ...LIST_KEYS.flatMap((k) => lists[k])].filter(Boolean);

  return (
    <div className="page">
      <div className="page-head fade-up">
        <div>
          <p className="eyebrow">Researcher discovery</p>
          <h1>Discover researchers</h1>
          <p className="muted">Search by name, research domain, skill, interest or institution.</p>
        </div>
      </div>

      <div className="search-bar card fade-up">
        <Icon name="search" size={20} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try “machine learning”, “Python”, “BUET” or a name…"
          aria-label="Search researchers"
          autoFocus
        />
        {q && (
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => setQ('')} aria-label="Clear search">
            <Icon name="x" size={16} />
          </button>
        )}
        <button type="button" className="btn btn--secondary btn--sm discover__filter-toggle" onClick={() => setShowFilters((s) => !s)}>
          <Icon name="filter" size={16} /> Filters{activeChips.length ? ` (${activeChips.length})` : ''}
        </button>
      </div>

      <div className="discover">
        <aside className={`discover__filters card ${showFilters ? 'is-open' : ''}`} aria-label="Filters">
          <div className="discover__filters-head">
            <h3><Icon name="filter" size={17} /> Filters</h3>
            {activeChips.length > 0 && <button type="button" className="link-btn" onClick={clearAll}>Clear all</button>}
          </div>

          <div className="facet">
            <h4>Role</h4>
            <select value={role} onChange={(e) => update({ role: e.target.value })} aria-label="Filter by role">
              <option value="">All roles</option>
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div className="facet">
            <h4>Institution</h4>
            <select value={institution} onChange={(e) => update({ institution: e.target.value })} aria-label="Filter by institution">
              <option value="">All institutions</option>
              {(facets?.institutions || []).map((i) => <option key={i.label} value={i.label}>{i.label} ({i.count})</option>)}
              {institution && !(facets?.institutions || []).some((i) => i.label === institution) && <option value={institution}>{institution}</option>}
            </select>
          </div>

          {facets ? (
            <>
              <FacetGroup title="Research domain" items={facets.domains} selected={lists.domain} onToggle={(l) => toggleList('domain', l)} />
              <FacetGroup title="Skill" items={facets.skills} selected={lists.skill} onToggle={(l) => toggleList('skill', l)} />
              <FacetGroup title="Interest" items={facets.interests} selected={lists.interest} onToggle={(l) => toggleList('interest', l)} />
            </>
          ) : (
            <p className="muted small">Loading filters…</p>
          )}
        </aside>

        <section className="discover__results">
          <div className="results-bar">
            <p className="muted" aria-live="polite">
              {loading ? 'Searching…' : result ? `${result.total} researcher${result.total === 1 ? '' : 's'} found` : ''}
            </p>
            <label className="sort-select">
              Sort by
              <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
                <option value="relevance">Relevance</option>
                <option value="newest">Newest members</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </label>
          </div>

          {activeChips.length > 0 && (
            <div className="active-chips">
              {activeChips.map((c) => (
                <button
                  type="button"
                  key={`${c.key}-${c.value}`}
                  className="chip chip--filter chip-enter"
                  onClick={() => (LIST_KEYS.includes(c.key) ? toggleList(c.key, c.value) : update({ [c.key]: '' }))}
                >
                  {c.label} <Icon name="x" size={12} strokeWidth={2.4} />
                </button>
              ))}
            </div>
          )}

          {error && <div className="alert alert--error"><Icon name="alert" size={16} /> {error}</div>}

          {loading && !result ? (
            <div className="card-grid">
              {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : result && result.items.length ? (
            <>
              <div className={`card-grid ${loading ? 'is-loading' : ''}`}>
                {result.items.map((r, i) => <ResearcherCard key={r.id} researcher={r} index={i} highlight={highlight} />)}
              </div>
              <Pagination page={result.page} pages={result.pages} onChange={(p) => { update({ page: String(p) }, false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </>
          ) : (
            !error && (
              <EmptyState icon="search" title="No researchers found" action={activeChips.length || q ? <button type="button" className="btn btn--secondary" onClick={clearAll}>Clear search & filters</button> : null}>
                Try a broader keyword or remove some filters.
              </EmptyState>
            )
          )}
        </section>
      </div>
    </div>
  );
}
