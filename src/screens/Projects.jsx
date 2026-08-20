import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logActivity, ACTIVITY_TYPES } from '../lib/activity';
import { useTheme } from '../context/ThemeContext';

const STATUSES = ['In Progress', 'Completed', 'On Hold', 'Planning'];
const COLORS = [
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#38bdf8',
  '#8b5cf6',
  '#ec4899',
];

const STATUS_COLORS = {
  'In Progress': '#06b6d4',
  'Completed': '#10b981',
  'On Hold': '#f59e0b',
  'Planning': '#38bdf8',
};


export default function Projects() {
  const { theme: C } = useTheme();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({
    name: '', description: '', status: 'In Progress',
    progress: 0, tech_stack: '', github_url: '',
    live_url: '', deadline: '', color: '#6366f1',
  });

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      name: '', description: '', status: 'In Progress',
      progress: 0, tech_stack: '', github_url: '',
      live_url: '', deadline: '', color: '#6366f1',
    });
    setEditProject(null);
    setShowForm(false);
  };

  const openEdit = (project) => {
    setForm({
      ...project,
      tech_stack: (project.tech_stack || []).join(', '),
    });
    setEditProject(project);
    setShowForm(true);
  };
const saveProject = async () => {
  if (!form.name) { alert('Please enter a project name.'); return; }
  const payload = {
    ...form,
    user_id: user.id,
    progress: parseInt(form.progress) || 0,
    tech_stack: form.tech_stack.split(',').map(t => t.trim()).filter(Boolean),
  };
  if (editProject) {
    await supabase.from('projects').update(payload).eq('id', editProject.id);
    await logActivity(user.id, {
      type: ACTIVITY_TYPES.PROJECT_UPDATED,
      title: `Updated ${form.name}`,
      subtitle: `${form.progress}% complete · ${form.status}`,
      icon: '◈', color: form.color || '#06b6d4',
    });
  } else {
    await supabase.from('projects').insert(payload);
    await logActivity(user.id, {
      type: ACTIVITY_TYPES.PROJECT_ADDED,
      title: `Added project: ${form.name}`,
      subtitle: (form.tech_stack || '').split(',').slice(0, 3).join(' · '),
      icon: '◈', color: form.color || '#06b6d4',
    });
  }
  loadProjects();
  resetForm();
};

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    await supabase.from('projects').delete().eq('id', id);
    setProjects(projects.filter(p => p.id !== id));
  };

  const filtered = filter === 'All' ? projects : projects.filter(p => p.status === filter);

  const inputStyle = {
    backgroundColor: '#111120', border: '1px solid #1e2035', borderRadius: 10,
    padding: '10px 14px', color: '#e8e8f0', fontSize: 14, width: '100%',
    outline: 'none', marginBottom: 12,
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#e8e8f0' }}>Projects</div>
          <div style={{ fontSize: 14, color: '#4a4a6a', marginTop: 4 }}>{projects.length} total · {projects.filter(p => p.status === 'In Progress').length} active</div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ backgroundColor: '#06b6d4', color: 'white', border: 'none', borderRadius: 12, padding: '12px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          + New Project
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['All', ...STATUSES].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              backgroundColor: filter === f ? '#06b6d4' : '#12121a',
              color: filter === f ? 'white' : '#4a4a6a',
              fontSize: 13, fontWeight: 600,
              border: `1px solid ${filter === f ? '#06b6d4' : '#2a2a3a'}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ color: '#8888a8' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#8888a8', marginBottom: 8 }}>No projects yet</div>
          <div style={{ fontSize: 14, color: '#4a4a6a', marginBottom: 24 }}>Start tracking your builds</div>
          <button
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: '#06b6d4', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
          >
            Add Your First Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map(project => (
            <div
              key={project.id}
              style={{
                backgroundColor: '#0d0d1a', borderRadius: 16, padding: 20,
                border: '1px solid #1e2035', borderTop: `3px solid ${project.color || '#06b6d4'}`,
              }}
            >
              {/* Project Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0ff', marginBottom: 4 }}>{project.name}</div>
                  {project.description && (
                    <div style={{ fontSize: 12, color: '#4a4a6a', lineHeight: 1.5 }}>{project.description}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                  <button onClick={() => openEdit(project)} style={{ background: 'none', border: 'none', color: '#4a4a6a', cursor: 'pointer', fontSize: 14 }}>✏️</button>
                  <button onClick={() => deleteProject(project.id)} style={{ background: 'none', border: 'none', color: '#4a4a6a', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                </div>
              </div>

              {/* Status */}
              <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: (STATUS_COLORS[project.status] || '#06b6d4') + '20', padding: '3px 10px', borderRadius: 20, marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLORS[project.status] || '#06b6d4' }}>{project.status}</span>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#4a4a6a' }}>Progress</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: project.color || '#06b6d4' }}>{project.progress}%</span>
                </div>
                <div style={{ backgroundColor: '#1e2035', borderRadius: 4, height: 6 }}>
                  <div style={{ backgroundColor: project.color || '#06b6d4', width: `${project.progress}%`, height: 6, borderRadius: 4 }} />
                </div>
              </div>

              {/* Tech Stack */}
              {project.tech_stack?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                  {project.tech_stack.map((tech, i) => (
                    <span key={i} style={{ fontSize: 11, color: '#9898b0', backgroundColor: '#111120', padding: '3px 8px', borderRadius: 6, border: '1px solid #1e2035' }}>
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {/* Links */}
              <div style={{ display: 'flex', gap: 8 }}>
                {project.github_url && (
                  <a href={project.github_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#22d3ee', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ⌥ GitHub
                  </a>
                )}
                {project.live_url && (
                  <a href={project.live_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ↗ Live
                  </a>
                )}
                {project.deadline && (
                  <span style={{ fontSize: 12, color: '#4a4a6a', marginLeft: 'auto' }}>📅 {project.deadline}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 24,
        }}>
          <div style={{
            backgroundColor: '#12121a', borderRadius: 20, padding: 32,
            width: '100%', maxWidth: 560, border: '1px solid #1e2035',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f0f0ff' }}>
                {editProject ? 'Edit Project' : 'New Project'}
              </div>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#4a4a6a', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>

            <div style={{ fontSize: 13, color: '#9898b0', marginBottom: 6, fontWeight: 600 }}>Project Name *</div>
            <input style={inputStyle} placeholder="e.g. Momentum PWA" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

            <div style={{ fontSize: 13, color: '#9898b0', marginBottom: 6, fontWeight: 600 }}>Description</div>
            <textarea style={{ ...inputStyle, height: 80, resize: 'none' }} placeholder="What does this project do?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: '#9898b0', marginBottom: 6, fontWeight: 600 }}>Status</div>
                <select style={{ ...inputStyle }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#8888a8', marginBottom: 6, fontWeight: 600 }}>Progress (%)</div>
                <input style={inputStyle} type="number" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: e.target.value })} />
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#8888a8', marginBottom: 6, fontWeight: 600 }}>Tech Stack (comma separated)</div>
            <input style={inputStyle} placeholder="e.g. React, Supabase, Vite" value={form.tech_stack} onChange={e => setForm({ ...form, tech_stack: e.target.value })} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: '#8888a8', marginBottom: 6, fontWeight: 600 }}>GitHub URL</div>
                <input style={inputStyle} placeholder="https://github.com/..." value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#8888a8', marginBottom: 6, fontWeight: 600 }}>Live URL</div>
                <input style={inputStyle} placeholder="https://..." value={form.live_url} onChange={e => setForm({ ...form, live_url: e.target.value })} />
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#8888a8', marginBottom: 6, fontWeight: 600 }}>Deadline</div>
            <input style={inputStyle} placeholder="e.g. Dec 2025" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />

            <div style={{ fontSize: 13, color: '#8888a8', marginBottom: 10, fontWeight: 600 }}>Color</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: 28, height: 28, borderRadius: 8, backgroundColor: c, cursor: 'pointer',
                    border: form.color === c ? '3px solid white' : '3px solid transparent',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={resetForm} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid #1e2035', backgroundColor: 'transparent', color: '#8888a8', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={saveProject} style={{ flex: 2, padding: 14, borderRadius: 12, border: 'none', backgroundColor: '#06b6d4', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                {editProject ? 'Save Changes' : 'Add Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}