import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProfileAPI, errorMessage, fieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AvatarUploader from '../components/AvatarUploader';
import { Field } from '../components/FormControls';
import { Spinner } from '../components/Feedback';
import Icon from '../components/Icon';
import { ROLE_OPTIONS } from '../utils/format';

const emptyEdu = { degree: '', field: '', institution: '', startYear: '', endYear: '' };

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({
    name: user.name,
    role: user.role,
    headline: user.headline || '',
    designation: user.designation || '',
    institution: user.institution || '',
    department: user.department || '',
    location: user.location || '',
    bio: user.bio || '',
    links: { website: '', googleScholar: '', orcid: '', researchGate: '', linkedin: '', github: '', ...user.links },
    education: (user.education || []).map((e) => ({ ...emptyEdu, ...e, startYear: e.startYear || '', endYear: e.endYear || '' })),
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setLink = (key) => (e) => setForm((f) => ({ ...f, links: { ...f.links, [key]: e.target.value } }));
  const setEdu = (i, key) => (e) =>
    setForm((f) => ({ ...f, education: f.education.map((ed, idx) => (idx === i ? { ...ed, [key]: e.target.value } : ed)) }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    form.education.forEach((ed, i) => {
      if (!ed.degree.trim()) errs[`education[${i}].degree`] = 'Degree is required';
      if (!ed.institution.trim()) errs[`education[${i}].institution`] = 'Institution is required';
      if (ed.startYear && ed.endYear && Number(ed.endYear) < Number(ed.startYear)) errs[`education[${i}].endYear`] = 'End year is before start year';
    });
    setErrors(errs);
    if (Object.keys(errs).length) return toast.error('Please fix the highlighted fields.');

    setSaving(true);
    try {
      const links = {};
      ['website', 'googleScholar', 'orcid', 'researchGate', 'linkedin', 'github'].forEach((k) => {
        links[k] = (form.links[k] || '').trim();
      });
      const payload = {
        ...form,
        links,
        education: form.education.map((ed) => ({
          degree: ed.degree,
          field: ed.field,
          institution: ed.institution,
          startYear: ed.startYear ? Number(ed.startYear) : null,
          endYear: ed.endYear ? Number(ed.endYear) : null,
        })),
      };
      const data = await ProfileAPI.update(payload);
      setUser(data.user);
      toast.success('Profile saved');
      navigate('/profile');
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
    return null;
  };

  const bioLeft = 1500 - form.bio.length;

  return (
    <div className="page page--narrow">
      <div className="page-head fade-up">
        <div>
          <Link to="/profile" className="back-link"><Icon name="arrow-left" size={16} /> Back to profile</Link>
          <h1>Edit profile</h1>
          <p className="muted">Your academic information helps others find and recognise you.</p>
        </div>
      </div>

      <section className="card section fade-up">
        <AvatarUploader />
      </section>

      <form onSubmit={submit} className="form" noValidate>
        <section className="card section fade-up" style={{ animationDelay: '60ms' }}>
          <h2 className="section__title"><Icon name="user" size={18} /> Basic information</h2>
          <div className="form-grid-2">
            <Field label="Full name" htmlFor="name" error={errors.name} required>
              <input id="name" value={form.name} onChange={set('name')} maxLength={80} />
            </Field>
            <Field label="Role" htmlFor="role">
              <select id="role" value={form.role} onChange={set('role')}>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Headline" htmlFor="headline" error={errors.headline} hint="One line about your research, e.g. “MSc student working on Bangla NLP”">
            <input id="headline" value={form.headline} onChange={set('headline')} maxLength={140} />
          </Field>
          <Field label="Bio" htmlFor="bio" error={errors.bio} hint={`${bioLeft} characters left`}>
            <textarea id="bio" rows={5} value={form.bio} onChange={set('bio')} maxLength={1500} placeholder="What are you researching? What kind of collaborators are you looking for?" />
          </Field>
        </section>

        <section className="card section fade-up" style={{ animationDelay: '120ms' }}>
          <h2 className="section__title"><Icon name="building" size={18} /> Academic affiliation</h2>
          <div className="form-grid-2">
            <Field label="Institution" htmlFor="institution" error={errors.institution}>
              <input id="institution" value={form.institution} onChange={set('institution')} maxLength={120} />
            </Field>
            <Field label="Department" htmlFor="department" error={errors.department}>
              <input id="department" value={form.department} onChange={set('department')} maxLength={120} />
            </Field>
            <Field label="Designation" htmlFor="designation" hint="e.g. Lecturer, MSc Student, Research Assistant">
              <input id="designation" value={form.designation} onChange={set('designation')} maxLength={80} />
            </Field>
            <Field label="Location" htmlFor="location">
              <input id="location" value={form.location} onChange={set('location')} maxLength={80} placeholder="Dhaka, Bangladesh" />
            </Field>
          </div>
        </section>

        <section className="card section fade-up" style={{ animationDelay: '180ms' }}>
          <div className="section__head-row">
            <h2 className="section__title"><Icon name="graduation" size={18} /> Education</h2>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setForm((f) => ({ ...f, education: [...f.education, { ...emptyEdu }] }))}
              disabled={form.education.length >= 10}
            >
              <Icon name="plus" size={16} /> Add
            </button>
          </div>
          {form.education.length === 0 && <p className="muted">No education added yet.</p>}
          {form.education.map((ed, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="edu-row pop-in">
              <div className="form-grid-2">
                <Field label="Degree" error={errors[`education[${i}].degree`]} required>
                  <input value={ed.degree} onChange={setEdu(i, 'degree')} placeholder="BSc in Software Engineering" maxLength={100} />
                </Field>
                <Field label="Field of study">
                  <input value={ed.field} onChange={setEdu(i, 'field')} placeholder="Machine Learning" maxLength={100} />
                </Field>
                <Field label="Institution" error={errors[`education[${i}].institution`]} required>
                  <input value={ed.institution} onChange={setEdu(i, 'institution')} maxLength={120} />
                </Field>
                <div className="form-grid-2">
                  <Field label="Start year" error={errors[`education[${i}].startYear`]}>
                    <input type="number" min="1950" max="2100" value={ed.startYear} onChange={setEdu(i, 'startYear')} />
                  </Field>
                  <Field label="End year" error={errors[`education[${i}].endYear`]}>
                    <input type="number" min="1950" max="2100" value={ed.endYear} onChange={setEdu(i, 'endYear')} placeholder="Present" />
                  </Field>
                </div>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--sm btn--danger-text"
                onClick={() => setForm((f) => ({ ...f, education: f.education.filter((_, idx) => idx !== i) }))}
              >
                <Icon name="trash" size={15} /> Remove
              </button>
            </div>
          ))}
        </section>

        <section className="card section fade-up" style={{ animationDelay: '240ms' }}>
          <h2 className="section__title"><Icon name="link" size={18} /> Research links</h2>
          <div className="form-grid-2">
            {[
              ['website', 'Personal website', 'https://'],
              ['googleScholar', 'Google Scholar', 'https://scholar.google.com/…'],
              ['researchGate', 'ResearchGate', 'https://www.researchgate.net/…'],
              ['linkedin', 'LinkedIn', 'https://www.linkedin.com/in/…'],
              ['github', 'GitHub', 'https://github.com/…'],
              ['orcid', 'ORCID iD', '0000-0002-1825-0097'],
            ].map(([key, label, ph]) => (
              <Field key={key} label={label} htmlFor={key} error={errors[`links.${key}`]}>
                <input id={key} value={form.links[key] || ''} onChange={setLink(key)} placeholder={ph} />
              </Field>
            ))}
          </div>
        </section>

        <div className="sticky-actions">
          <Link to="/profile" className="btn btn--ghost">Cancel</Link>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <><Spinner light /> Saving…</> : <><Icon name="check" size={17} /> Save changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
