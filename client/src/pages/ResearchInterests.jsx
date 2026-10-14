import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ResearchAPI, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';
import TagInput from '../components/TagInput';
import useDebounce from '../hooks/useDebounce';
import { SKILL_LEVELS, capitalize } from '../utils/format';

const SECTIONS = [
  { field: 'researchDomains', title: 'Research domains', icon: 'layers', max: 15, tone: 'domain',
    hint: 'The broad areas you work in — these carry the most weight in matching.', placeholder: 'e.g. Natural Language Processing' },
  { field: 'interests', title: 'Research interests', icon: 'target', max: 30, tone: 'default',
    hint: 'Specific topics you want to explore or collaborate on.', placeholder: 'e.g. Bangla NLP, Explainable AI' },
  { field: 'expertise', title: 'Expertise', icon: 'star', max: 20, tone: 'outline',
    hint: 'Research methods and roles you are experienced in.', placeholder: 'e.g. Literature Review, Experimental Design' },
];

function SkillSuggestInput({ onAdd, disabled }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [suggest, setSuggest] = useState([]);
  const [busy, setBusy] = useState(false);
  const q = useDebounce(name, 250);

  useEffect(() => {
    if (!q) return setSuggest([]);
    const ctrl = new AbortController();
    ResearchAPI.suggestions('skills', q, ctrl.signal).then((s) => setSuggest(s.slice(0, 6))).catch(() => {});
    return () => ctrl.abort();
  }, [q]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const ok = await onAdd({ name: name.trim(), level });
    setBusy(false);
    if (ok) {
      setName('');
      setSuggest([]);
    }
  };

  return (
    <form className="skill-add" onSubmit={submit}>
      <div className="skill-add__name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 60))}
          placeholder="Add a skill, e.g. PyTorch"
          aria-label="Skill name"
          disabled={disabled}
          list="skill-suggestions"
        />
        <datalist id="skill-suggestions">
          {suggest.map((s) => <option key={s.label} value={s.label} />)}
        </datalist>
      </div>
      <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Skill level" disabled={disabled}>
        {SKILL_LEVELS.map((l) => <option key={l} value={l}>{capitalize(l)}</option>)}
      </select>
      <button type="submit" className="btn btn--primary" disabled={!name.trim() || busy || disabled}>
        <Icon name="plus" size={17} /> Add
      </button>
    </form>
  );
}

export default function ResearchInterests() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [onboarding] = useState(Boolean(location.state?.onboarding));

  const apply = (research) => setUser((u) => ({ ...u, ...research }));

  const run = async (promise, okMessage) => {
    try {
      const data = await promise;
      apply(data.research);
      if (okMessage) toast.success(okMessage);
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    }
  };

  const total = user.researchDomains.length + user.interests.length + user.expertise.length + user.skills.length;

  return (
    <div className="page">
      <div className="page-head fade-up">
        <div>
          <p className="eyebrow">Research profile</p>
          <h1>Skills & interests</h1>
          <p className="muted">These power researcher search and your collaborator recommendations. Changes save instantly.</p>
        </div>
        <Link to="/recommendations" className="btn btn--secondary" aria-disabled={total === 0}>
          <Icon name="sparkles" size={17} /> See my matches
        </Link>
      </div>

      {onboarding && (
        <div className="callout fade-up">
          <Icon name="sparkles" size={22} />
          <div>
            <strong>Welcome aboard! Let’s set up your research profile.</strong>
            <p>Add a few domains, skills and interests — it takes a minute and unlocks personalised collaborator recommendations.</p>
          </div>
        </div>
      )}

      <div className="research-grid">
        {SECTIONS.map((s, i) => (
          <section key={s.field} className="card section stagger-item" style={{ '--i': i }}>
            <h2 className="section__title"><Icon name={s.icon} size={18} /> {s.title}</h2>
            <p className="muted small">{s.hint}</p>
            <TagInput
              field={s.field}
              values={user[s.field]}
              max={s.max}
              tone={s.tone}
              placeholder={s.placeholder}
              onAdd={(v) => run(ResearchAPI.addTag(s.field, v))}
              onRemove={(v) => run(ResearchAPI.removeTag(s.field, v))}
            />
          </section>
        ))}

        <section className="card section research-grid__skills stagger-item" style={{ '--i': 3 }}>
          <h2 className="section__title"><Icon name="tool" size={18} /> Skills <span className="count-badge">{user.skills.length}/40</span></h2>
          <p className="muted small">Technical and research skills with your proficiency level.</p>
          <SkillSuggestInput onAdd={(skill) => run(ResearchAPI.addSkill(skill), `Added ${skill.name}`)} disabled={user.skills.length >= 40} />

          {user.skills.length === 0 ? (
            <p className="muted empty-inline">No skills yet — add your first one above.</p>
          ) : (
            <ul className="skill-list">
              {user.skills.map((skill) => (
                <li key={skill._id} className="skill-item pop-in">
                  <span className="skill-item__name">{skill.name}</span>
                  <div className="level-picker" role="radiogroup" aria-label={`${skill.name} level`}>
                    {SKILL_LEVELS.map((l, idx) => (
                      <button
                        key={l}
                        type="button"
                        role="radio"
                        aria-checked={skill.level === l}
                        title={capitalize(l)}
                        className={`level-dot ${SKILL_LEVELS.indexOf(skill.level) >= idx ? 'is-on' : ''}`}
                        onClick={() => skill.level !== l && run(ResearchAPI.updateSkill(skill._id, { level: l }))}
                      />
                    ))}
                    <small>{capitalize(skill.level)}</small>
                  </div>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    onClick={() => run(ResearchAPI.removeSkill(skill._id))}
                    aria-label={`Remove ${skill.name}`}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
