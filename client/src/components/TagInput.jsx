import { useEffect, useId, useRef, useState } from 'react';
import { ResearchAPI } from '../api/client';
import useDebounce from '../hooks/useDebounce';
import Icon from './Icon';

/**
 * Chip input with autocomplete from /taxonomy/suggestions (FR-02).
 * onAdd(value) / onRemove(value) may return promises; the input disables while pending.
 */
export default function TagInput({ field, values = [], onAdd, onRemove, placeholder, max, tone = 'default' }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const debounced = useDebounce(text, 250);
  const listId = useId();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const ctrl = new AbortController();
    ResearchAPI.suggestions(field, debounced, ctrl.signal)
      .then((s) => {
        const have = new Set(values.map((v) => v.toLowerCase()));
        setSuggestions(s.filter((x) => !have.has(x.label.toLowerCase())).slice(0, 8));
        setActive(-1);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [debounced, field, open, values]);

  const add = async (raw) => {
    const value = raw.trim().replace(/\s+/g, ' ');
    if (!value || busy) return;
    if (values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      setText('');
      return;
    }
    setBusy(true);
    try {
      await onAdd(value);
      setText('');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(suggestions.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(active >= 0 && suggestions[active] ? suggestions[active].label : text);
    } else if (e.key === 'Backspace' && !text && values.length) {
      onRemove(values[values.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const full = max && values.length >= max;

  return (
    <div className={`tag-input tag-input--${tone}`}>
      <div className="tag-input__box" onClick={() => inputRef.current?.focus()}>
        {values.map((v) => (
          <span key={v} className="chip chip-enter">
            {v}
            <button type="button" onClick={() => onRemove(v)} aria-label={`Remove ${v}`}>
              <Icon name="x" size={12} strokeWidth={2.4} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={text}
          disabled={full}
          onChange={(e) => {
            setText(e.target.value.slice(0, 60));
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={full ? `Maximum of ${max} reached` : placeholder}
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        {busy && <span className="spinner" style={{ width: 14, height: 14 }} />}
      </div>
      {open && suggestions.length > 0 && !full && (
        <ul className="suggest-list" id={listId} role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s.label}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'is-active' : ''}
              onMouseDown={(e) => {
                e.preventDefault();
                add(s.label);
              }}
            >
              <Icon name="plus" size={14} />
              <span>{s.label}</span>
              {s.count > 0 && <small>{s.count} researcher{s.count > 1 ? 's' : ''}</small>}
            </li>
          ))}
        </ul>
      )}
      {max && (
        <p className="field-hint">
          {values.length}/{max} · Press Enter to add, Backspace to remove the last one
        </p>
      )}
    </div>
  );
}
