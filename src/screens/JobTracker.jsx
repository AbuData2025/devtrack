import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logActivity, ACTIVITY_TYPES } from '../lib/activity';
import { useTheme } from '../context/ThemeContext';

const STATUSES = ['Applied', 'Shortlisted', 'Assessment', 'Interview', 'Offer', 'Rejected'];

const STATUS_COLORS = {
  Applied: '#4a9ef5',
  Shortlisted: '#06b6d4',
  Assessment: '#f5a623',
  Interview: '#818cf8',
  Offer: '#10b981',
  Rejected: '#e85555',
};



export default function JobTracker() {
  const { theme: C } = useTheme();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({
    company: '', role: '', status: 'Applied',
    date_applied: '', salary: '', location: '',
    remote: false, interview_date: '', notes: '', url: '',
  });

  useEffect(() => { if (user) loadJobs(); }, [user]);

  const loadJobs = async () => {
    const { data } = await supabase.from('jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ company: '', role: '', status: 'Applied', date_applied: '', salary: '', location: '', remote: false, interview_date: '', notes: '', url: '' });
    setEditJob(null);
    setShowForm(false);
  };

  const openEdit = (job) => { setForm(job); setEditJob(job); setShowForm(true); };

const saveJob = async () => {
  if (!form.company || !form.role) { alert('Please enter company and role.'); return; }
  const payload = { ...form, user_id: user.id };
  if (editJob) {
    await supabase.from('jobs').update(payload).eq('id', editJob.id);
    await logActivity(user.id, {
      type: ACTIVITY_TYPES.JOB_STATUS,
      title: `Updated ${form.company} application`,
      subtitle: `${form.role} · ${form.status}`,
      icon: '💼', color: '#818cf8',
    });
  } else {
    await supabase.from('jobs').insert(payload);
    await logActivity(user.id, {
      type: ACTIVITY_TYPES.JOB_ADDED,
      title: `Applied to ${form.company}`,
      subtitle: `${form.role} · ${form.status}`,
      icon: '💼', color: '#06b6d4',
    });
  }
  loadJobs();
  resetForm();
};

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    await supabase.from('jobs').delete().eq('id', id);
    setJobs(jobs.filter(j => j.id !== id));
  };

 const updateStatus = async (id, status) => {
  const job = jobs.find(j => j.id === id);
  await supabase.from('jobs').update({ status }).eq('id', id);
  setJobs(jobs.map(j => j.id === id ? { ...j, status } : j));
  await logActivity(user.id, {
    type: ACTIVITY_TYPES.JOB_STATUS,
    title: `${job.company} → ${status}`,
    subtitle: job.role,
    icon: status === 'Offer' ? '🎉' : status === 'Interview' ? '🎤' : status === 'Rejected' ? '❌' : '📋',
    color: status === 'Offer' ? '#10b981' : status === 'Rejected' ? '#e85555' : '#06b6d4',
  });
};

  const filtered = filter === 'All' ? jobs : jobs.filter(j => j.status === filter);
  const statusCounts = STATUSES.reduce((acc, s) => { acc[s] = jobs.filter(j => j.status === s).length; return acc; }, {});

  const inputStyle = {
    backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '10px 14px', color: C.text, fontSize: 14, width: '100%',
    outline: 'none', marginBottom: 12, fontFamily: 'monospace',
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>Job Tracker</div>
          <div style={{ fontSize: 13, color: C.text3, marginTop: 4, fontFamily: 'monospace' }}>
            // {jobs.length} applications · {statusCounts['Interview'] || 0} interviews · {statusCounts['Offer'] || 0} offers
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', border: 'none', borderRadius: 12, padding: '12px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: `0 4px 16px rgba(6,182,212,0.3)` }}
        >
          + Add Application
        </button>
      </div>

      {/* Pipeline Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
        {STATUSES.map(status => (
          <div
            key={status}
            onClick={() => setFilter(filter === status ? 'All' : status)}
            style={{
              backgroundColor: C.bg2, borderRadius: 12, padding: 14,
              border: `1px solid ${filter === status ? STATUS_COLORS[status] : C.border}`,
              cursor: 'pointer', textAlign: 'center',
              borderTop: `3px solid ${STATUS_COLORS[status]}`,
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: STATUS_COLORS[status], fontFamily: 'monospace' }}>
              {statusCounts[status] || 0}
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{status}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['All', ...STATUSES].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 20,
              border: `1px solid ${filter === f ? C.cyan : C.border}`,
              backgroundColor: filter === f ? 'rgba(6,182,212,0.15)' : 'transparent',
              color: filter === f ? C.cyan : C.text3,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {f} {f !== 'All' && statusCounts[f] ? `(${statusCounts[f]})` : ''}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {loading ? (
        <div style={{ color: C.text2, fontFamily: 'monospace' }}>$ loading jobs...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text2, marginBottom: 8 }}>No applications yet</div>
          <div style={{ fontSize: 13, color: C.text3, fontFamily: 'monospace', marginBottom: 24 }}>// start tracking your job search</div>
          <button onClick={() => setShowForm(true)} style={{ background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            Add First Application
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(job => {
            const color = STATUS_COLORS[job.status] || C.blue;
            return (
              <div key={job.id} style={{ backgroundColor: C.bg2, borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16, borderLeft: `3px solid ${color}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, backgroundColor: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color, fontFamily: 'monospace' }}>
                  {job.company[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: 'monospace' }}>{job.company}</span>
                    {job.remote && <span style={{ fontSize: 10, backgroundColor: 'rgba(16,185,129,0.15)', color: C.green, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>REMOTE</span>}
                  </div>
                  <div style={{ fontSize: 13, color: C.text2 }}>{job.role}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    {job.date_applied && <span style={{ fontSize: 11, color: C.text3 }}>📅 {job.date_applied}</span>}
                    {job.location && <span style={{ fontSize: 11, color: C.text3 }}>📍 {job.location}</span>}
                    {job.salary && <span style={{ fontSize: 11, color: C.text3 }}>💰 {job.salary}</span>}
                    {job.interview_date && <span style={{ fontSize: 11, color: '#818cf8' }}>🎤 Interview: {job.interview_date}</span>}
                  </div>
                  {job.notes && <div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>📝 {job.notes}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <select
                    value={job.status}
                    onChange={e => updateStatus(job.id, e.target.value)}
                    style={{ backgroundColor: color + '20', color, border: `1px solid ${color}40`, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.cyan, textDecoration: 'none' }}>↗ Link</a>}
                    <button onClick={() => openEdit(job)} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 13 }}>✏️</button>
                    <button onClick={() => deleteJob(job.id)} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 13 }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ backgroundColor: C.bg2, borderRadius: 20, padding: 32, width: '100%', maxWidth: 560, border: `1px solid ${C.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{editJob ? 'Edit Application' : 'Add Application'}</div>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Company *</div><input style={inputStyle} placeholder="e.g. Google" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
              <div><div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Role *</div><input style={inputStyle} placeholder="e.g. Junior Developer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Status</div>
                <select style={{ ...inputStyle }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Date Applied</div><input style={inputStyle} placeholder="e.g. 27 Jul 2026" value={form.date_applied} onChange={e => setForm({ ...form, date_applied: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Location</div><input style={inputStyle} placeholder="e.g. Cape Town" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div><div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Salary</div><input style={inputStyle} placeholder="e.g. R25,000/month" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
            </div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Interview Date</div>
            <input style={inputStyle} placeholder="e.g. 15 Aug 2026" value={form.interview_date} onChange={e => setForm({ ...form, interview_date: e.target.value })} />
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Job URL</div>
            <input style={inputStyle} placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Notes</div>
            <textarea style={{ ...inputStyle, height: 80, resize: 'none' }} placeholder="Interview notes, contact info..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <input type="checkbox" id="remote" checked={form.remote} onChange={e => setForm({ ...form, remote: e.target.checked })} />
              <label htmlFor="remote" style={{ fontSize: 13, color: C.text2, cursor: 'pointer' }}>Remote position</label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={resetForm} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, backgroundColor: 'transparent', color: C.text2, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={saveJob} style={{ flex: 2, padding: 14, borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>{editJob ? 'Save Changes' : 'Add Application'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}