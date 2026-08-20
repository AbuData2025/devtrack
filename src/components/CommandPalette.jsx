import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';



const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: '⊞', category: 'Navigate', path: '/dashboard' },
  { id: 'projects', label: 'Go to Projects', icon: '◈', category: 'Navigate', path: '/projects' },
  { id: 'jobs', label: 'Go to Job Tracker', icon: '◎', category: 'Navigate', path: '/jobs' },
  { id: 'analytics', label: 'Go to Analytics', icon: '◉', category: 'Navigate', path: '/analytics' },
  { id: 'focus', label: 'Go to Focus Mode', icon: '◌', category: 'Navigate', path: '/focus' },
  { id: 'new-project', label: 'New Project', icon: '＋', category: 'Create', path: '/projects' },
  { id: 'new-job', label: 'Add Job Application', icon: '＋', category: 'Create', path: '/jobs' },
  { id: 'log-session', label: 'Log Coding Session', icon: '⌨', category: 'Create', path: '/analytics' },
  { id: 'report', label: 'Weekly Report', icon: '📋', category: 'Navigate', path: '/weekly-report' },
  { id: 'timeline', label: 'Project Timeline', icon: '▤', category: 'Navigate', path: '/timeline' },
  { id: 'interview-prep', label: 'Interview Prep', icon: '🎤', category: 'Navigate', path: '/interview-prep' },
];

export default function CommandPalette({ open, onClose }) {
  const { theme: C } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open ? onClose() : null;
      }
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') setSelected(s => Math.min(s + 1, filtered.length - 1));
      if (e.key === 'ArrowUp') setSelected(s => Math.max(s - 1, 0));
      if (e.key === 'Enter' && filtered[selected]) {
        navigate(filtered[selected].path);
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selected, query]);

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const categories = [...new Set(filtered.map(c => c.category))];

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)', zIndex: 1000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          backgroundColor: C.bg2, borderRadius: 16,
          border: `1px solid ${C.border}`,
          boxShadow: `0 0 60px rgba(6,182,212,0.15), 0 25px 50px rgba(0,0,0,0.5)`,
          overflow: 'hidden',
        }}
      >
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 16, color: C.text3 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search commands..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: C.text, fontSize: 15, fontFamily: 'monospace',
            }}
          />
          <kbd style={{ fontSize: 11, color: C.text3, backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: '2px 6px' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: C.text3, fontFamily: 'monospace', fontSize: 13 }}>
              // no commands found
            </div>
          ) : (
            categories.map(category => (
              <div key={category}>
                <div style={{ padding: '8px 20px 4px', fontSize: 10, color: C.text3, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {category}
                </div>
                {filtered.filter(c => c.category === category).map((cmd, i) => {
                  const globalIndex = filtered.indexOf(cmd);
                  const isSelected = globalIndex === selected;
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => { navigate(cmd.path); onClose(); }}
                      onMouseEnter={() => setSelected(globalIndex)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 20px', cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(6,182,212,0.1)' : 'transparent',
                        borderLeft: isSelected ? `2px solid ${C.cyan}` : '2px solid transparent',
                        transition: 'all 0.1s',
                      }}
                    >
                      <span style={{ fontSize: 16, color: isSelected ? C.cyan : C.text3, width: 20, textAlign: 'center' }}>{cmd.icon}</span>
                      <span style={{ fontSize: 14, color: isSelected ? C.text : C.text2, fontFamily: 'monospace' }}>{cmd.label}</span>
                      {isSelected && (
                        <kbd style={{ marginLeft: 'auto', fontSize: 11, color: C.text3, backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: '2px 6px' }}>↵</kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 16 }}>
          {[['↑↓', 'Navigate'], ['↵', 'Select'], ['ESC', 'Close']].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <kbd style={{ fontSize: 10, color: C.text3, backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>{key}</kbd>
              <span style={{ fontSize: 11, color: C.text3 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}