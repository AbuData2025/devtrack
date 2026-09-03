import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTheme } from '../context/ThemeContext';


const getWeekRange = (weeksAgo = 0) => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

const formatDate = (d) => d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });

const GRADES = [
  { min: 90, grade: 'S', label: 'Outstanding', color: '#06b6d4' },
  { min: 75, grade: 'A', label: 'Excellent', color: '#10b981' },
  { min: 60, grade: 'B', label: 'Good', color: '#818cf8' },
  { min: 45, grade: 'C', label: 'Average', color: '#f5a623' },
  { min: 0, grade: 'D', label: 'Needs Work', color: '#e85555' },
];

const getGrade = (score) => GRADES.find(g => score >= g.min) || GRADES[GRADES.length - 1];

export default function WeeklyReport() {
  const { theme: C } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [weeksAgo, setWeeksAgo] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allWeeks, setAllWeeks] = useState([]);

  useEffect(() => {
    if (user) loadReport();
  }, [user, weeksAgo]);

  const loadReport = async () => {
    setLoading(true);
    const { start, end } = getWeekRange(weeksAgo);

    const [{ data: jobs }, { data: sessions }, { data: goals }, { data: projects }, { data: activity }] = await Promise.all([
      supabase.from('jobs').select('*').eq('user_id', user.id).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('coding_sessions').select('*').eq('user_id', user.id).gte('date_key', start.toISOString().split('T')[0]).lte('date_key', end.toISOString().split('T')[0]),
      supabase.from('daily_goals').select('*').eq('user_id', user.id).gte('date_key', start.toISOString().split('T')[0]).lte('date_key', end.toISOString().split('T')[0]),
      supabase.from('projects').select('*').eq('user_id', user.id),
      supabase.from('activity_feed').select('*').eq('user_id', user.id).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).order('created_at', { ascending: false }),
    ]);

    const totalMins = (sessions || []).reduce((sum, s) => sum + s.duration_minutes, 0);
    const codingHours = totalMins / 60;
    const completedGoals = (goals || []).filter(g => g.completed).length;
    const totalGoals = (goals || []).length;
    const goalRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    const jobsApplied = (jobs || []).length;
    const interviews = (jobs || []).filter(j => j.status === 'Interview' || j.status === 'Assessment').length;

    // Daily breakdown
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyData = days.map((day, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const dayMins = (sessions || []).filter(s => s.date_key === key).reduce((sum, s) => sum + s.duration_minutes, 0);
      const dayGoals = (goals || []).filter(g => g.date_key === key && g.completed).length;
      return { day, hours: parseFloat((dayMins / 60).toFixed(1)), goals: dayGoals };
    });

    // Score calculation
    const codingScore = Math.min(100, (codingHours / 20) * 100); // 20h = 100%
    const jobScore = Math.min(100, (jobsApplied / 5) * 100); // 5 apps = 100%
    const goalScore = goalRate;
    const consistencyScore = (dailyData.filter(d => d.hours > 0).length / 5) * 100; // 5 days = 100%
    const overallScore = Math.round((codingScore * 0.35) + (jobScore * 0.25) + (goalScore * 0.25) + (consistencyScore * 0.15));

    setData({
      week: { start, end },
      codingHours: parseFloat(codingHours.toFixed(1)),
      jobsApplied,
      interviews,
      completedGoals,
      totalGoals,
      goalRate: Math.round(goalRate),
      dailyData,
      activity: activity || [],
      scores: { coding: Math.round(codingScore), jobs: Math.round(jobScore), goals: Math.round(goalScore), consistency: Math.round(consistencyScore), overall: overallScore },
      activeProjects: (projects || []).filter(p => p.status === 'In Progress').length,
    });
    setLoading(false);
  };

  if (loading) return (
    <div style={{ padding: 32, color: C.text3, fontFamily: 'monospace' }}>$ generating report...</div>
  );

  const { scores } = data;
  const grade = getGrade(scores.overall);

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>Weekly Report</div>
          <div style={{ fontSize: 13, color: C.text3, fontFamily: 'monospace', marginTop: 4 }}>
            // {formatDate(data.week.start)} — {formatDate(data.week.end)}
          </div>
        </div>

        {/* Week Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setWeeksAgo(w => w + 1)}
            style={{ backgroundColor: C.bg2, color: C.text2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 14 }}
          >
            ←
          </button>
          <div style={{ backgroundColor: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: C.text, fontFamily: 'monospace', minWidth: 120, textAlign: 'center' }}>
            {weeksAgo === 0 ? 'This Week' : weeksAgo === 1 ? 'Last Week' : `${weeksAgo} weeks ago`}
          </div>
          <button
            onClick={() => setWeeksAgo(w => Math.max(0, w - 1))}
            disabled={weeksAgo === 0}
            style={{ backgroundColor: C.bg2, color: weeksAgo === 0 ? C.text3 : C.text2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', cursor: weeksAgo === 0 ? 'not-allowed' : 'pointer', fontSize: 14 }}
          >
            →
          </button>
        </div>
      </div>

      {/* Overall Grade */}
      <div style={{
        backgroundColor: C.bg2, borderRadius: 16, padding: 28,
        border: `1px solid ${grade.color}40`, marginBottom: 24,
        background: `linear-gradient(135deg, ${C.bg2} 0%, ${grade.color}08 100%)`,
        display: 'flex', alignItems: 'center', gap: 24,
      }}>
        {/* Grade Circle */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%', flexShrink: 0,
          border: `3px solid ${grade.color}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 30px ${grade.color}30`,
        }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: grade.color, fontFamily: 'monospace', lineHeight: 1 }}>{grade.grade}</div>
          <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{scores.overall}%</div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 6 }}>
            {grade.label} Week
          </div>
          <div style={{ fontSize: 13, color: C.text2, marginBottom: 16 }}>
            {scores.overall >= 75
              ? "You crushed it this week. Keep the momentum going! 🚀"
              : scores.overall >= 50
              ? "Solid week. A few more pushes and you'll be at the top. 💪"
              : "This week was tough. Tomorrow is a fresh start. 🌱"}
          </div>

          {/* Score Bars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Coding', score: scores.coding, color: C.cyan },
              { label: 'Job Hunt', score: scores.jobs, color: C.green },
              { label: 'Goals', score: scores.goals, color: C.purple },
              { label: 'Consistency', score: scores.consistency, color: C.amber },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: C.text3 }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: s.color, fontWeight: 700, fontFamily: 'monospace' }}>{s.score}%</span>
                </div>
                <div style={{ backgroundColor: C.border, borderRadius: 4, height: 6 }}>
                  <div style={{ backgroundColor: s.color, width: `${s.score}%`, height: 6, borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Hours Coded', value: `${data.codingHours}h`, sub: 'Target: 20h', color: C.cyan, icon: '⌨', pct: Math.min(100, (data.codingHours / 20) * 100) },
          { label: 'Jobs Applied', value: data.jobsApplied, sub: `${data.interviews} interviews`, color: C.green, icon: '💼', pct: Math.min(100, (data.jobsApplied / 5) * 100) },
          { label: 'Goals Done', value: `${data.completedGoals}/${data.totalGoals}`, sub: `${data.goalRate}% completion`, color: C.purple, icon: '✓', pct: data.goalRate },
          { label: 'Active Projects', value: data.activeProjects, sub: 'In progress', color: C.amber, icon: '◈', pct: Math.min(100, data.activeProjects * 20) },
        ].map((s, i) => (
          <div key={i} style={{ backgroundColor: C.bg2, borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 20, color: s.color }}>{s.icon}</span>
              <span style={{ fontSize: 10, color: C.text3, backgroundColor: C.bg3, padding: '2px 8px', borderRadius: 20, fontFamily: 'monospace' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: 'monospace', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.text3, marginBottom: 8 }}>{s.sub}</div>
            <div style={{ backgroundColor: C.border, borderRadius: 4, height: 4 }}>
              <div style={{ backgroundColor: s.color, width: `${s.pct}%`, height: 4, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Daily Breakdown Chart */}
        <div style={{ backgroundColor: C.bg2, borderRadius: 14, padding: 22, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>Daily Breakdown</div>
          <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginBottom: 20 }}>// coding hours per day</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.text3, fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.text3, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'monospace' }}
                formatter={(val, name) => [name === 'hours' ? `${val}h` : val, name === 'hours' ? 'Coding' : 'Goals']}
              />
              <Bar dataKey="hours" fill={C.cyan} radius={[4, 4, 0, 0]} />
              <Bar dataKey="goals" fill={C.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: C.cyan }} />
              <span style={{ fontSize: 11, color: C.text3 }}>Coding hours</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: C.green }} />
              <span style={{ fontSize: 11, color: C.text3 }}>Goals completed</span>
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div style={{ backgroundColor: C.bg2, borderRadius: 14, padding: 22, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>This Week's Activity</div>
          <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginBottom: 16 }}>// {data.activity.length} actions logged</div>

          {data.activity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: C.text3, fontFamily: 'monospace', fontSize: 12 }}>
              // no activity this week
            </div>
          ) : (
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {data.activity.slice(0, 10).map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < data.activity.length - 1 ? `1px solid ${C.bg3}` : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: (a.color || C.cyan) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                    {a.icon || '📌'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                    {a.subtitle && <div style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>{a.subtitle}</div>}
                  </div>
                  <div style={{ fontSize: 10, color: C.text3, fontFamily: 'monospace', flexShrink: 0 }}>
                    {new Date(a.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Next Week Goals */}
      <div style={{ backgroundColor: C.bg2, borderRadius: 14, padding: 22, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 }}>Next Week's Targets</div>
        <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace', marginBottom: 16 }}>// based on your performance</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            {
              icon: '⌨', label: 'Coding Hours',
              target: data.codingHours < 10 ? '10h' : data.codingHours < 15 ? '15h' : '20h',
              tip: data.codingHours < 10 ? 'Start with 2h daily sessions' : 'Push for 3h daily',
              color: C.cyan,
            },
            {
              icon: '💼', label: 'Job Applications',
              target: data.jobsApplied < 3 ? '3 apps' : data.jobsApplied < 5 ? '5 apps' : '7 apps',
              tip: data.jobsApplied < 3 ? 'Apply to at least 1 per day' : 'Keep the momentum!',
              color: C.green,
            },
            {
              icon: '✓', label: 'Goal Completion',
              target: data.goalRate < 50 ? '60%' : data.goalRate < 75 ? '80%' : '90%',
              tip: data.goalRate < 50 ? 'Set fewer, achievable goals' : 'You\'re almost there!',
              color: C.purple,
            },
            {
              icon: '◈', label: 'Project Progress',
              target: `+${data.activeProjects > 0 ? '10' : '1'} ${data.activeProjects > 0 ? '%' : 'project'}`,
              tip: data.activeProjects === 0 ? 'Start a new project' : 'Push each project forward',
              color: C.amber,
            },
          ].map((t, i) => (
            <div key={i} style={{ backgroundColor: C.bg3, borderRadius: 12, padding: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{t.icon}</div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>{t.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: t.color, fontFamily: 'monospace', marginBottom: 6 }}>{t.target}</div>
              <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.4 }}>{t.tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}