import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ActivityFeed from '../components/ActivityFeed';
import { useTheme } from '../context/ThemeContext';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getTodayKey = () => new Date().toISOString().split('T')[0];



export default function Dashboard() {
  const { theme: C } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [goals, setGoals] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    const todayKey = getTodayKey();
    const [{ data: p }, { data: j }, { data: g }, { data: s }] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', user.id),
      supabase.from('jobs').select('*').eq('user_id', user.id),
      supabase.from('daily_goals').select('*').eq('user_id', user.id).eq('date_key', todayKey),
      supabase.from('coding_sessions').select('*').eq('user_id', user.id),
    ]);
    setProjects(p || []);
    setJobs(j || []);
    setGoals(g || []);
    setSessions(s || []);
    setLoading(false);
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    const goal = { user_id: user.id, date_key: getTodayKey(), text: newGoal.trim(), completed: false };
    const { data } = await supabase.from('daily_goals').insert(goal).select().single();
    if (data) setGoals([...goals, data]);
    setNewGoal('');
  };

  const toggleGoal = async (goal) => {
    await supabase.from('daily_goals').update({ completed: !goal.completed }).eq('id', goal.id);
    setGoals(goals.map(g => g.id === goal.id ? { ...g, completed: !g.completed } : g));
  };

  const deleteGoal = async (id) => {
    await supabase.from('daily_goals').delete().eq('id', id);
    setGoals(goals.filter(g => g.id !== id));
  };

  const completedGoals = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const thisWeekJobs = jobs.filter(j => {
    const d = new Date(j.created_at);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return d >= weekStart;
  }).length;
  const totalCodingMins = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const codingHours = (totalCodingMins / 60).toFixed(1);

  const calculateStreak = () => {
    const sessionDates = [...new Set(sessions.map(s => s.date_key))].sort().reverse();
    if (!sessionDates.length) return 0;
    let streak = 0;
    const today = getTodayKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    if (sessionDates[0] !== today && sessionDates[0] !== yesterdayKey) return 0;
    let checkDate = new Date(sessionDates[0]);
    for (const date of sessionDates) {
      const diff = Math.round((checkDate - new Date(date)) / 86400000);
      if (diff <= 1) { streak++; checkDate = new Date(date); } else break;
    }
    return streak;
  };

  const streak = calculateStreak();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Developer';

  if (loading) return <div style={{ padding: 32, color: C.text2, fontFamily: 'monospace' }}>$ loading...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace', marginBottom: 6 }}>
          {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>{getGreeting()}, {firstName} 👋</div>
        {streak > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 20, padding: '4px 12px', marginTop: 10 }}>
            <span>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.amber, fontFamily: 'monospace' }}>{streak} day coding streak</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Active Projects', value: activeProjects, sub: `${projects.length} total`, icon: '◈', color: C.cyan, onClick: () => navigate('/projects') },
          { label: 'Jobs Applied', value: jobs.length, sub: `${thisWeekJobs} this week`, icon: '◎', color: C.green, onClick: () => navigate('/jobs') },
          { label: 'Coding Hours', value: codingHours, sub: 'Total logged', icon: '⌨', color: C.amber, onClick: () => navigate('/analytics') },
          { label: 'Goals Today', value: `${completedGoals}/${totalGoals}`, sub: completedGoals === totalGoals && totalGoals > 0 ? '🎉 All done!' : 'Keep going!', icon: '✓', color: C.purple },
        ].map((s, i) => (
          <div
            key={i}
            onClick={s.onClick}
            style={{
              backgroundColor: C.bg2, borderRadius: 14, padding: 18,
              border: `1px solid ${C.border}`, cursor: s.onClick ? 'pointer' : 'default',
              transition: 'border-color 0.2s, transform 0.1s',
            }}
            onMouseEnter={e => { if (s.onClick) { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 20, color: s.color }}>{s.icon}</div>
              <div style={{ fontSize: 10, color: C.text3, backgroundColor: C.bg3, padding: '2px 8px', borderRadius: 20, fontFamily: 'monospace' }}>{s.label}</div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.color, fontFamily: 'monospace', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.text3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Today's Goals */}
        <div style={{ backgroundColor: C.bg2, borderRadius: 14, padding: 22, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Today's Goals</div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace' }}>{getTodayKey()}</div>
          </div>

          <form onSubmit={addGoal} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              value={newGoal}
              onChange={e => setNewGoal(e.target.value)}
              placeholder="Add a goal for today..."
              style={{
                flex: 1, backgroundColor: C.bg3, border: `1px solid ${C.border}`,
                borderRadius: 9, padding: '9px 14px', color: C.text,
                fontSize: 13, outline: 'none', fontFamily: 'monospace',
              }}
            />
            <button type="submit" style={{
              background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`,
              color: 'white', border: 'none', borderRadius: 9,
              padding: '9px 16px', cursor: 'pointer', fontWeight: 800, fontSize: 16,
            }}>+</button>
          </form>

          {goals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.text3, fontSize: 12, fontFamily: 'monospace' }}>
              // no goals yet
            </div>
          ) : (
            goals.map(goal => (
              <div key={goal.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.bg3}` }}>
                <div
                  onClick={() => toggleGoal(goal)}
                  style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
                    backgroundColor: goal.completed ? C.cyan : 'transparent',
                    border: `2px solid ${goal.completed ? C.cyan : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {goal.completed && <span style={{ color: 'white', fontSize: 11 }}>✓</span>}
                </div>
                <span style={{
                  flex: 1, fontSize: 13, fontFamily: 'monospace',
                  color: goal.completed ? C.text3 : C.text,
                  textDecoration: goal.completed ? 'line-through' : 'none',
                }}>
                  {goal.text}
                </span>
                <button onClick={() => deleteGoal(goal.id)} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            ))
          )}

          {totalGoals > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: C.text3 }}>Progress</span>
                <span style={{ fontSize: 11, color: C.cyan, fontWeight: 700, fontFamily: 'monospace' }}>
                  {Math.round((completedGoals / totalGoals) * 100)}%
                </span>
              </div>
              <div style={{ backgroundColor: C.border, borderRadius: 4, height: 4 }}>
                <div style={{
                  background: `linear-gradient(90deg, ${C.cyan}, ${C.green})`,
                  width: `${(completedGoals / totalGoals) * 100}%`,
                  height: 4, borderRadius: 4, transition: 'width 0.3s',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div style={{ backgroundColor: C.bg2, borderRadius: 14, padding: 22, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Active Projects</div>
            <button onClick={() => navigate('/projects')} style={{ fontSize: 12, color: C.cyan, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace' }}>
              view all →
            </button>
          </div>

          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8, color: C.text3 }}>◈</div>
              <div style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace', marginBottom: 12 }}>// no projects yet</div>
              <button onClick={() => navigate('/projects')} style={{ background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', border: 'none', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                Add Project
              </button>
            </div>
          ) : (
            projects.slice(0, 4).map(project => (
              <div key={project.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: project.color || C.cyan }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>{project.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: project.color || C.cyan, fontWeight: 700, fontFamily: 'monospace' }}>{project.progress}%</span>
                </div>
                <div style={{ backgroundColor: C.border, borderRadius: 3, height: 4 }}>
                  <div style={{ backgroundColor: project.color || C.cyan, width: `${project.progress}%`, height: 4, borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                  {(project.tech_stack || []).slice(0, 3).map((tech, i) => (
                    <span key={i} style={{ fontSize: 10, color: C.text3, backgroundColor: C.bg3, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{tech}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      <div style={{ backgroundColor: C.bg2, borderRadius: 14, padding: 22, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Recent Applications</div>
          <button onClick={() => navigate('/jobs')} style={{ fontSize: 12, color: C.cyan, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace' }}>
            view all →
          </button>
        </div>

        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace', marginBottom: 12 }}>// no applications yet</div>
            <button onClick={() => navigate('/jobs')} style={{ background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', border: 'none', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Track Application
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {jobs.slice(0, 6).map(job => {
              const statusColors = { Applied: C.blue, Interview: C.green, 'In Review': C.amber, Offer: C.green, Rejected: C.red, Shortlisted: C.cyan, Assessment: C.purple };
              const color = statusColors[job.status] || C.blue;
              return (
                <div key={job.id} style={{ backgroundColor: C.bg3, borderRadius: 10, padding: 14, borderLeft: `3px solid ${color}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2, fontFamily: 'monospace' }}>{job.company}</div>
                  <div style={{ fontSize: 11, color: C.text2, marginBottom: 8 }}>{job.role}</div>
                  <div style={{ display: 'inline-flex', backgroundColor: color + '20', padding: '2px 8px', borderRadius: 20 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color }}>{job.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}{/* Activity Feed */}
<div style={{ backgroundColor: C.bg2, borderRadius: 14, padding: 22, border: `1px solid ${C.border}`, marginTop: 20 }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Activity Feed</div>
      <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginTop: 2 }}>// your recent actions</div>
    </div>
    <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.green, boxShadow: `0 0 8px ${C.green}` }} />
  </div>
  <ActivityFeed limit={8} compact={true} />
</div>
      </div>
    </div>
  );
}
