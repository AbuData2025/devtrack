import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { logActivity, ACTIVITY_TYPES } from '../lib/activity';
import { useTheme } from '../context/ThemeContext';



const LANG_COLORS = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3776ab',
  'C#': '#9b4f96', SQL: '#e48e00', HTML: '#e34f26',
  CSS: '#1572b6', Java: '#007396', Kotlin: '#7f52ff',
};

export default function Analytics() {
  const { theme: C } = useTheme();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [githubUsername, setGithubUsername] = useState('');
  const [githubData, setGithubData] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({ duration_minutes: '', project: '', notes: '' });

  useEffect(() => {
    if (user) loadAll();
    const saved = localStorage.getItem('githubUsername');
    if (saved) { setGithubUsername(saved); fetchGithub(saved); }
  }, [user]);

  const loadAll = async () => {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('coding_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('projects').select('*').eq('user_id', user.id),
    ]);
    setSessions(s || []);
    setProjects(p || []);
  };

  const fetchGithub = async (username) => {
    if (!username) return;
    setGithubLoading(true);
    try {
      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
      ]);
      const userData = await userRes.json();
      const reposData = await reposRes.json();
      if (userData.login) {
        const languages = {};
        reposData.forEach(repo => {
          if (repo.language) languages[repo.language] = (languages[repo.language] || 0) + 1;
        });
        setGithubData({
          ...userData, repos: reposData, languages,
          totalStars: reposData.reduce((sum, r) => sum + r.stargazers_count, 0),
        });
        localStorage.setItem('githubUsername', username);
      }
    } catch (e) { console.error('GitHub fetch failed:', e); }
    setGithubLoading(false);
  };

  const logSession = async () => {
  if (!sessionForm.duration_minutes) { alert('Enter duration.'); return; }
  const session = {
    user_id: user.id,
    date_key: new Date().toISOString().split('T')[0],
    duration_minutes: parseInt(sessionForm.duration_minutes),
    project: sessionForm.project,
    notes: sessionForm.notes,
  };
  const { data } = await supabase.from('coding_sessions').insert(session).select().single();
  if (data) {
    setSessions([data, ...sessions]);
    await logActivity(user.id, {
      type: ACTIVITY_TYPES.SESSION_LOGGED,
      title: `Logged ${(parseInt(sessionForm.duration_minutes) / 60).toFixed(1)}h coding session`,
      subtitle: sessionForm.project ? `on ${sessionForm.project}` : sessionForm.notes || 'General coding',
      icon: '⌨', color: '#06b6d4',
    });
  }
  setSessionForm({ duration_minutes: '', project: '', notes: '' });
  setShowSessionForm(false);
};

  const totalMins = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const totalHours = (totalMins / 60).toFixed(1);
  const todayKey = new Date().toISOString().split('T')[0];
  const todayMins = sessions.filter(s => s.date_key === todayKey).reduce((sum, s) => sum + s.duration_minutes, 0);
  const avgSessionMins = sessions.length ? Math.round(totalMins / sessions.length) : 0;

  const uniqueDates = [...new Set(sessions.map(s => s.date_key))].sort().reverse();
  let streak = 0;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split('T')[0];
  if (uniqueDates.length && (uniqueDates[0] === todayKey || uniqueDates[0] === yesterdayKey)) {
    let check = new Date(uniqueDates[0]);
    for (const d of uniqueDates) {
      const diff = Math.round((check - new Date(d)) / 86400000);
      if (diff <= 1) { streak++; check = new Date(d); } else break;
    }
  }

  const langEntries = githubData?.languages
    ? Object.entries(githubData.languages).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];
  const langTotal = langEntries.reduce((sum, [, v]) => sum + v, 0);

  const inputStyle = {
    backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '10px 14px', color: C.text, fontSize: 14, width: '100%',
    outline: 'none', marginBottom: 12, fontFamily: 'monospace',
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>Developer Analytics</div>
        <div style={{ fontSize: 13, color: C.text3, marginTop: 4, fontFamily: 'monospace' }}>
          // your coding activity and github statistics
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Hours', value: totalHours, sub: 'Logged coding time', color: C.cyan, icon: '⌨' },
          { label: 'Today', value: `${(todayMins / 60).toFixed(1)}h`, sub: `${todayMins} minutes`, color: C.green, icon: '📅' },
          { label: 'Coding Streak', value: `${streak}d`, sub: 'Consecutive days', color: C.amber, icon: '🔥' },
          { label: 'Avg Session', value: `${(avgSessionMins / 60).toFixed(1)}h`, sub: `${avgSessionMins} minutes`, color: C.purple, icon: '⏱' },
        ].map((s, i) => (
          <div key={i} style={{ backgroundColor: C.bg2, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 22, color: s.color }}>{s.icon}</span>
              <span style={{ fontSize: 10, color: C.text3, backgroundColor: C.bg3, padding: '2px 8px', borderRadius: 20, fontFamily: 'monospace' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* GitHub */}
        <div style={{ backgroundColor: C.bg2, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 16 }}>GitHub Stats</div>
          {!githubData ? (
            <div>
              <div style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace', marginBottom: 12 }}>
                // enter username to pull live stats
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                  placeholder="e.g. AbuData2025"
                  value={githubUsername}
                  onChange={e => setGithubUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchGithub(githubUsername)}
                />
                <button
                  onClick={() => fetchGithub(githubUsername)}
                  disabled={githubLoading}
                  style={{ background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  {githubLoading ? '...' : 'Connect'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src={githubData.avatar_url} alt="avatar" style={{ width: 48, height: 48, borderRadius: 24, border: `2px solid ${C.cyan}` }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>{githubData.name || githubData.login}</div>
                  <div style={{ fontSize: 12, color: C.cyan }}>@{githubData.login}</div>
                </div>
                <button
                  onClick={() => { setGithubData(null); setGithubUsername(''); localStorage.removeItem('githubUsername'); }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 12 }}
                >
                  Disconnect
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Repos', value: githubData.public_repos },
                  { label: 'Followers', value: githubData.followers },
                  { label: 'Stars', value: githubData.totalStars },
                ].map((s, i) => (
                  <div key={i} style={{ backgroundColor: C.bg3, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.cyan, fontFamily: 'monospace' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {githubData.bio && (
                <div style={{ marginTop: 12, fontSize: 12, color: C.text2, fontStyle: 'italic' }}>"{githubData.bio}"</div>
              )}
            </div>
          )}
        </div>

        {/* Languages */}
        <div style={{ backgroundColor: C.bg2, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 16 }}>Languages Used</div>
          {langEntries.length === 0 ? (
            <div style={{ color: C.text3, fontSize: 12, fontFamily: 'monospace' }}>
              // connect github to see language breakdown
            </div>
          ) : (
            langEntries.map(([lang, count]) => {
              const pct = Math.round((count / langTotal) * 100);
              const color = LANG_COLORS[lang] || C.cyan;
              return (
                <div key={lang} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 600, fontFamily: 'monospace' }}>{lang}</span>
                    <span style={{ fontSize: 13, color, fontWeight: 700, fontFamily: 'monospace' }}>{pct}%</span>
                  </div>
                  <div style={{ backgroundColor: C.border, borderRadius: 4, height: 8 }}>
                    <div style={{ backgroundColor: color, width: `${pct}%`, height: 8, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Charts Row */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
  {/* Sessions by Day */}
  <div style={{ backgroundColor: C.bg2, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
    <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>Coding by Day</div>
    <div style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace', marginBottom: 20 }}>// hours per day of week</div>
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={(() => {
        const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        return days.map((day, i) => ({
          day,
          hours: parseFloat((sessions.filter(s => new Date(s.date_key).getDay() === (i + 1) % 7).reduce((sum, s) => sum + s.duration_minutes, 0) / 60).toFixed(1)),
        }));
      })()}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
        <XAxis dataKey="day" tick={{ fill: C.text3, fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: C.text3, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'monospace' }}
          formatter={(val) => [`${val}h`, 'Hours']}
        />
        <Bar dataKey="hours" fill={C.cyan} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>

  {/* Sessions over time */}
  <div style={{ backgroundColor: C.bg2, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
    <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>Coding Trend</div>
    <div style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace', marginBottom: 20 }}>// last 14 days</div>
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={(() => {
        return Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (13 - i));
          const key = d.toISOString().split('T')[0];
          const hrs = parseFloat((sessions.filter(s => s.date_key === key).reduce((sum, s) => sum + s.duration_minutes, 0) / 60).toFixed(1));
          return { date: d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }), hours: hrs };
        });
      })()}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
        <XAxis dataKey="date" tick={{ fill: C.text3, fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={2} />
        <YAxis tick={{ fill: C.text3, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'monospace' }}
          formatter={(val) => [`${val}h`, 'Hours']}
        />
        <Line type="monotone" dataKey="hours" stroke={C.cyan} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>

{/* GitHub Heatmap */}
<div style={{ backgroundColor: C.bg2, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 24 }}>
  <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>Coding Heatmap</div>
  <div style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace', marginBottom: 20 }}>// last 52 weeks of coding activity</div>
  <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 8 }}>
    {Array.from({ length: 52 }, (_, week) => (
      <div key={week} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {Array.from({ length: 7 }, (_, day) => {
          const d = new Date();
          d.setDate(d.getDate() - ((51 - week) * 7 + (6 - day)));
          const key = d.toISOString().split('T')[0];
          const mins = sessions.filter(s => s.date_key === key).reduce((sum, s) => sum + s.duration_minutes, 0);
          const intensity = mins === 0 ? 0 : mins < 60 ? 1 : mins < 120 ? 2 : mins < 180 ? 3 : 4;
          const colors = ['#1e2035', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9'];
          return (
            <div
              key={day}
              title={`${key}: ${(mins / 60).toFixed(1)}h`}
              style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: colors[intensity], cursor: 'pointer' }}
            />
          );
        })}
      </div>
    ))}
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
    <span style={{ fontSize: 11, color: C.text3 }}>Less</span>
    {['#1e2035', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9'].map((c, i) => (
      <div key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c }} />
    ))}
    <span style={{ fontSize: 11, color: C.text3 }}>More</span>
  </div>
</div>

      {/* Coding Sessions */}
      <div style={{ backgroundColor: C.bg2, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Coding Sessions</div>
          <button
            onClick={() => setShowSessionForm(!showSessionForm)}
            style={{ background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
          >
            + Log Session
          </button>
        </div>

        {showSessionForm && (
          <div style={{ backgroundColor: C.bg3, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: C.text2, marginBottom: 6 }}>Duration (minutes) *</div>
                <input style={inputStyle} type="number" placeholder="e.g. 90" value={sessionForm.duration_minutes} onChange={e => setSessionForm({ ...sessionForm, duration_minutes: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.text2, marginBottom: 6 }}>Project</div>
                <select style={{ ...inputStyle }} value={sessionForm.project} onChange={e => setSessionForm({ ...sessionForm, project: e.target.value })}>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 6 }}>Notes</div>
            <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="What did you work on?" value={sessionForm.notes} onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowSessionForm(false)} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, backgroundColor: 'transparent', color: C.text2, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={logSession} style={{ flex: 2, padding: 10, borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Log Session</button>
            </div>
          </div>
        )}

        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.text3, fontFamily: 'monospace' }}>
            // no sessions logged yet — track your coding time!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.slice(0, 10).map(session => (
              <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.bg3}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: C.cyan }}>⌨</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: 'monospace' }}>{session.project || 'General coding'}</div>
                  <div style={{ fontSize: 12, color: C.text3 }}>{session.date_key}{session.notes && ` · ${session.notes}`}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.cyan, fontFamily: 'monospace' }}>{(session.duration_minutes / 60).toFixed(1)}h</div>
                  <div style={{ fontSize: 11, color: C.text3 }}>{session.duration_minutes} mins</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}