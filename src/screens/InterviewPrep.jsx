import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logActivity, ACTIVITY_TYPES } from '../lib/activity';
import { useTheme } from '../context/ThemeContext';



const STAGES = ['Preparation', 'Phone Screen', 'Technical', 'HR Round', 'Final Round', 'Completed'];
const OUTCOMES = ['Pending', 'Passed', 'Failed', 'Ghosted', 'Withdrew'];

const STAGE_COLORS = {
  Preparation: '#818cf8',
  'Phone Screen': '#06b6d4',
  Technical: '#f5a623',
  'HR Round': '#4a9ef5',
  'Final Round': '#10b981',
  Completed: '#10b981',
};

const OUTCOME_COLORS = {
  Pending: '#06b6d4',
  Passed: '#10b981',
  Failed: '#e85555',
  Ghosted: '#4a4a6a',
  Withdrew: '#f5a623',
};
const COMMON_QUESTIONS = [
  'Tell me about yourself',
  'Why do you want to work here?',
  'What are your strengths?',
  'What are your weaknesses?',
  'Where do you see yourself in 5 years?',
  'Why are you leaving your current role?',
  'Tell me about a challenging project',
  'How do you handle pressure?',
  'What is your greatest achievement?',
  'Do you have any questions for us?',
];

const TECH_QUESTIONS = [
  'Explain the difference between == and ===',
  'What is REST API?',
  'Explain OOP principles',
  'What is version control?',
  'Explain async/await',
  'What is a database index?',
  'Explain the MVC pattern',
  'What is CI/CD?',
  'Explain time complexity',
  'What is Docker?',
];

export default function InterviewPrep() {
  const { theme: C } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preps, setPreps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [newQuestion, setNewQuestion] = useState('');
  const [form, setForm] = useState({
    company: '', role: '', interview_date: '',
    stage: 'Preparation', notes: '', outcome: 'Pending',
    job_id: '', rating: 0,
  });

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    const [{ data: p }, { data: j }] = await Promise.all([
      supabase.from('interview_prep').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('jobs').select('*').eq('user_id', user.id).in('status', ['Interview', 'Assessment', 'Shortlisted']),
    ]);
    setPreps(p || []);
    setJobs(j || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ company: '', role: '', interview_date: '', stage: 'Preparation', notes: '', outcome: 'Pending', job_id: '', rating: 0 });
    setShowForm(false);
  };

const savePrep = async () => {
  if (!form.company || !form.role) { alert('Please enter company and role.'); return; }
  const payload = {
    company: form.company,
    role: form.role,
    interview_date: form.interview_date || null,
    stage: form.stage,
    notes: form.notes || null,
    outcome: form.outcome,
    job_id: form.job_id || null,
    rating: form.rating || 0,
    user_id: user.id,
    questions: [],
  };
  const { data, error } = await supabase.from('interview_prep').insert(payload).select().single();
  if (error) { alert('Could not save. Check console.'); console.error(error); return; }
  if (data) {
    await logActivity(user.id, {
      type: 'interview_prep',
      title: `Interview prep: ${form.company}`,
      subtitle: `${form.role} · ${form.stage}`,
      icon: '🎤', color: C.purple,
    });
    resetForm();
    await loadAll();
    setSelected(data);
  }
};

  const updatePrep = async (id, updates) => {
    await supabase.from('interview_prep').update(updates).eq('id', id);
    setPreps(preps.map(p => p.id === id ? { ...p, ...updates } : p));
    if (selected?.id === id) setSelected(s => ({ ...s, ...updates }));
  };

  const deletePrep = async (id) => {
    if (!window.confirm('Delete this interview prep?')) return;
    await supabase.from('interview_prep').delete().eq('id', id);
    setPreps(preps.filter(p => p.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const addQuestion = async (text) => {
    if (!selected || !text.trim()) return;
    const questions = [...(selected.questions || []), { id: Date.now(), text: text.trim(), answer: '', done: false }];
    await updatePrep(selected.id, { questions });
    setNewQuestion('');
  };

  const updateQuestion = async (qId, updates) => {
    const questions = (selected.questions || []).map(q => q.id === qId ? { ...q, ...updates } : q);
    await updatePrep(selected.id, { questions });
  };

  const deleteQuestion = async (qId) => {
    const questions = (selected.questions || []).filter(q => q.id !== qId);
    await updatePrep(selected.id, { questions });
  };

  const inputStyle = {
    backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '10px 14px', color: C.text, fontSize: 13, width: '100%',
    outline: 'none', marginBottom: 12, fontFamily: 'monospace',
  };

  const statsData = {
    total: preps.length,
    upcoming: preps.filter(p => p.outcome === 'Pending').length,
    passed: preps.filter(p => p.outcome === 'Passed').length,
    avgRating: preps.length ? (preps.reduce((s, p) => s + (p.rating || 0), 0) / preps.length).toFixed(1) : 0,
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>Interview Prep</div>
          <div style={{ fontSize: 13, color: C.text3, fontFamily: 'monospace', marginTop: 4 }}>
            // track prep, questions and outcomes for every interview
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', border: 'none', borderRadius: 12, padding: '12px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
        >
          + Add Interview
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Interviews', value: statsData.total, color: C.cyan, icon: '🎤' },
          { label: 'Upcoming', value: statsData.upcoming, color: C.amber, icon: '📅' },
          { label: 'Passed', value: statsData.passed, color: C.green, icon: '✅' },
          { label: 'Avg Rating', value: `${statsData.avgRating}/5`, color: C.purple, icon: '⭐' },
        ].map((s, i) => (
          <div key={i} style={{ backgroundColor: C.bg2, borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <span style={{ fontSize: 10, color: C.text3, backgroundColor: C.bg3, padding: '2px 8px', borderRadius: 20, fontFamily: 'monospace' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '320px 1fr' : '1fr', gap: 20 }}>
        {/* Interview List */}
        <div>
          {loading ? (
            <div style={{ color: C.text3, fontFamily: 'monospace', fontSize: 12 }}>$ loading...</div>
          ) : preps.length === 0 ? (
            <div style={{ backgroundColor: C.bg2, borderRadius: 14, padding: 40, textAlign: 'center', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎤</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text2, marginBottom: 8 }}>No interviews yet</div>
              <div style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace', marginBottom: 20 }}>// add an interview to start prepping</div>
              <button onClick={() => setShowForm(true)} style={{ background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                Add Interview
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {preps.map(prep => {
                const isSelected = selected?.id === prep.id;
                const stageColor = STAGE_COLORS[prep.stage] || C.cyan;
                const outcomeColor = OUTCOME_COLORS[prep.outcome] || C.cyan;
                const questionsDone = (prep.questions || []).filter(q => q.done).length;
                const questionsTotal = (prep.questions || []).length;

                return (
                  <div
                    key={prep.id}
                    onClick={() => setSelected(isSelected ? null : prep)}
                    style={{
                      backgroundColor: C.bg2, borderRadius: 12, padding: 16,
                      border: `1px solid ${isSelected ? C.cyan : C.border}`,
                      cursor: 'pointer', transition: 'all 0.15s',
                      borderLeft: `3px solid ${stageColor}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: 'monospace' }}>{prep.company}</div>
                        <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{prep.role}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <div style={{ fontSize: 10, color: outcomeColor, backgroundColor: outcomeColor + '18', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                          {prep.outcome}
                        </div>
                        <div style={{ fontSize: 10, color: stageColor, fontFamily: 'monospace' }}>{prep.stage}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {prep.interview_date && (
                        <span style={{ fontSize: 11, color: C.text3 }}>📅 {prep.interview_date}</span>
                      )}
                      {questionsTotal > 0 && (
                        <span style={{ fontSize: 11, color: questionsDone === questionsTotal ? C.green : C.text3, fontFamily: 'monospace' }}>
                          {questionsDone}/{questionsTotal} questions
                        </span>
                      )}
                      {prep.rating > 0 && (
                        <span style={{ fontSize: 11, color: C.amber }}>{'⭐'.repeat(prep.rating)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ backgroundColor: C.bg2, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {/* Panel Header */}
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.text, fontFamily: 'monospace' }}>{selected.company}</div>
                <div style={{ fontSize: 13, color: C.text2 }}>{selected.role}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => deletePrep(selected.id)} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.text3, cursor: 'pointer', borderRadius: 8, padding: '4px 10px', fontSize: 13 }}>×</button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
              {['overview', 'questions', 'notes'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                    backgroundColor: activeTab === tab ? C.bg3 : 'transparent',
                    color: activeTab === tab ? C.cyan : C.text3,
                    borderBottom: activeTab === tab ? `2px solid ${C.cyan}` : '2px solid transparent',
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ padding: 20, maxHeight: 600, overflowY: 'auto' }}>
              {activeTab === 'overview' && (
                <>
                  {/* Stage */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginBottom: 8 }}>STAGE</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {STAGES.map(stage => (
                        <button
                          key={stage}
                          onClick={() => updatePrep(selected.id, { stage })}
                          style={{
                            padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            backgroundColor: selected.stage === stage ? STAGE_COLORS[stage] + '25' : C.bg3,
                            color: selected.stage === stage ? STAGE_COLORS[stage] : C.text3,
                            border: `1px solid ${selected.stage === stage ? STAGE_COLORS[stage] : C.border}`,
                          }}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Outcome */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginBottom: 8 }}>OUTCOME</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {OUTCOMES.map(outcome => (
                        <button
                          key={outcome}
                          onClick={() => updatePrep(selected.id, { outcome })}
                          style={{
                            padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            backgroundColor: selected.outcome === outcome ? OUTCOME_COLORS[outcome] + '25' : C.bg3,
                            color: selected.outcome === outcome ? OUTCOME_COLORS[outcome] : C.text3,
                            border: `1px solid ${selected.outcome === outcome ? OUTCOME_COLORS[outcome] : C.border}`,
                          }}
                        >
                          {outcome}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interview Date */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginBottom: 8 }}>INTERVIEW DATE</div>
                    <input
                      style={inputStyle}
                      placeholder="e.g. 15 Aug 2026"
                      value={selected.interview_date || ''}
                      onChange={e => updatePrep(selected.id, { interview_date: e.target.value })}
                    />
                  </div>

                  {/* Rating */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginBottom: 8 }}>SELF RATING</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => updatePrep(selected.id, { rating: star })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, opacity: star <= (selected.rating || 0) ? 1 : 0.3 }}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Progress Summary */}
                  {(selected.questions || []).length > 0 && (
                    <div style={{ backgroundColor: C.bg3, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 12, color: C.text2, marginBottom: 8 }}>Question Progress</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: C.text3 }}>{(selected.questions || []).filter(q => q.done).length} of {(selected.questions || []).length} prepared</span>
                        <span style={{ fontSize: 11, color: C.cyan, fontFamily: 'monospace' }}>
                          {Math.round(((selected.questions || []).filter(q => q.done).length / (selected.questions || []).length) * 100)}%
                        </span>
                      </div>
                      <div style={{ backgroundColor: C.border, borderRadius: 4, height: 6 }}>
                        <div style={{
                          background: `linear-gradient(90deg, ${C.cyan}, ${C.green})`,
                          width: `${((selected.questions || []).filter(q => q.done).length / (selected.questions || []).length) * 100}%`,
                          height: 6, borderRadius: 4,
                        }} />
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'questions' && (
                <>
                  {/* Add Question */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input
                        style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                        placeholder="Add a question to prepare..."
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addQuestion(newQuestion)}
                      />
                      <button
                        onClick={() => addQuestion(newQuestion)}
                        style={{ background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontWeight: 700 }}
                      >+</button>
                    </div>

                    {/* Quick Add Common Questions */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginBottom: 6 }}>// quick add common questions:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {COMMON_QUESTIONS.slice(0, 5).map((q, i) => (
                          <button
                            key={i}
                            onClick={() => addQuestion(q)}
                            style={{ fontSize: 10, color: C.text3, backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
                          >
                            {q.substring(0, 20)}...
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginBottom: 6 }}>// technical questions:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {TECH_QUESTIONS.slice(0, 5).map((q, i) => (
                          <button
                            key={i}
                            onClick={() => addQuestion(q)}
                            style={{ fontSize: 10, color: C.text3, backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
                          >
                            {q.substring(0, 20)}...
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Questions List */}
                  {(selected.questions || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: C.text3, fontFamily: 'monospace', fontSize: 12 }}>
                      // no questions yet — add some above
                    </div>
                  ) : (
                    (selected.questions || []).map(q => (
                      <div key={q.id} style={{ backgroundColor: C.bg3, borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${q.done ? C.green + '40' : C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: q.answer ? 8 : 0 }}>
                          <div
                            onClick={() => updateQuestion(q.id, { done: !q.done })}
                            style={{
                              width: 20, height: 20, borderRadius: 5, flexShrink: 0, cursor: 'pointer', marginTop: 1,
                              background: q.done ? `linear-gradient(135deg, ${C.cyan}, ${C.green})` : 'transparent',
                              border: `2px solid ${q.done ? C.cyan : C.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            {q.done && <span style={{ color: 'white', fontSize: 11 }}>✓</span>}
                          </div>
                          <span style={{
                            flex: 1, fontSize: 13, fontFamily: 'monospace',
                            color: q.done ? C.text3 : C.text,
                            textDecoration: q.done ? 'line-through' : 'none',
                          }}>
                            {q.text}
                          </span>
                          <button onClick={() => deleteQuestion(q.id)} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>×</button>
                        </div>
                        <textarea
                          placeholder="// your answer or notes..."
                          value={q.answer || ''}
                          onChange={e => updateQuestion(q.id, { answer: e.target.value })}
                          style={{
                            width: '100%', backgroundColor: C.bg2, border: `1px solid ${C.border}`,
                            borderRadius: 8, padding: '8px 12px', color: C.text2,
                            fontSize: 12, resize: 'none', outline: 'none', fontFamily: 'monospace',
                            lineHeight: 1.6, minHeight: 60, marginTop: 8,
                          }}
                        />
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === 'notes' && (
                <div>
                  <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginBottom: 12 }}>
                    // general notes, research, company info...
                  </div>
                  <textarea
                    placeholder="// research the company, note down key points, salary expectations..."
                    value={selected.notes || ''}
                    onChange={e => updatePrep(selected.id, { notes: e.target.value })}
                    style={{
                      width: '100%', backgroundColor: C.bg3, border: `1px solid ${C.border}`,
                      borderRadius: 12, padding: 16, color: C.text,
                      fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'monospace',
                      lineHeight: 1.7, minHeight: 300,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ backgroundColor: C.bg2, borderRadius: 20, padding: 32, width: '100%', maxWidth: 500, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Add Interview</div>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Company *</div>
                <input style={inputStyle} placeholder="e.g. Google" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Role *</div>
                <input style={inputStyle} placeholder="e.g. Junior Developer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Interview Date</div>
                <input style={inputStyle} placeholder="e.g. 15 Aug 2026" value={form.interview_date} onChange={e => setForm({ ...form, interview_date: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Stage</div>
                <select style={{ ...inputStyle }} value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Link to existing job */}
            {jobs.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: C.text2, marginBottom: 6, fontWeight: 600 }}>Link to Job Application</div>
                <select style={{ ...inputStyle }} value={form.job_id} onChange={e => setForm({ ...form, job_id: e.target.value })}>
                  <option value="">Select job...</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.company} — {j.role}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={resetForm} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, backgroundColor: 'transparent', color: C.text2, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={savePrep} style={{ flex: 2, padding: 14, borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Add Interview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}