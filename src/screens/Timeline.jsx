import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';



const STATUS_COLORS = {
  'In Progress': '#06b6d4',
  'Completed': '#10b981',
  'On Hold': '#f5a623',
  'Planning': '#818cf8',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Timeline() {
  const { theme: C } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMonths, setViewMonths] = useState(6);
  const [startOffset, setStartOffset] = useState(0);

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setProjects(data || []);
    setLoading(false);
  };

  // Build month columns
  const today = new Date();
  const startMonth = new Date(today.getFullYear(), today.getMonth() - 1 + startOffset, 1);
  const months = Array.from({ length: viewMonths }, (_, i) => {
    const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
    return { month: d.getMonth(), year: d.getFullYear(), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, date: d };
  });

  const totalDays = viewMonths * 30;
  const rangeStart = startMonth;
  const rangeEnd = new Date(startMonth.getFullYear(), startMonth.getMonth() + viewMonths, 0);

  const getBarStyle = (project) => {
    const created = new Date(project.created_at);
    const deadline = project.deadline ? new Date(project.deadline) : null;

    const projStart = created < rangeStart ? rangeStart : created;
    const projEnd = deadline ? (deadline > rangeEnd ? rangeEnd : deadline) : new Date(rangeStart.getTime() + totalDays * 86400000 * 0.5);

    const startPct = Math.max(0, (projStart - rangeStart) / (totalDays * 86400000)) * 100;
    const endPct = Math.min(100, (projEnd - rangeStart) / (totalDays * 86400000)) * 100;
    const width = Math.max(2, endPct - startPct);

    return { left: `${startPct}%`, width: `${width}%` };
  };

  const todayPct = ((today - rangeStart) / (totalDays * 86400000)) * 100;

  if (loading) return (
    <div style={{ padding: 32, color: C.text3, fontFamily: 'monospace' }}>$ loading timeline...</div>
  );

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>Project Timeline</div>
          <div style={{ fontSize: 13, color: C.text3, fontFamily: 'monospace', marginTop: 4 }}>
            // {projects.length} projects · Gantt view
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', backgroundColor: C.bg2, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {[3, 6, 12].map(m => (
              <button
                key={m}
                onClick={() => setViewMonths(m)}
                style={{
                  padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'monospace',
                  backgroundColor: viewMonths === m ? C.cyan : 'transparent',
                  color: viewMonths === m ? 'white' : C.text3,
                }}
              >
                {m}mo
              </button>
            ))}
          </div>
          {/* Navigation */}
          <button onClick={() => setStartOffset(o => o - viewMonths)} style={{ backgroundColor: C.bg2, color: C.text2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 14 }}>←</button>
          <button onClick={() => setStartOffset(0)} style={{ backgroundColor: C.bg2, color: C.cyan, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace' }}>today</button>
          <button onClick={() => setStartOffset(o => o + viewMonths)} style={{ backgroundColor: C.bg2, color: C.text2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 14 }}>→</button>
          <button
            onClick={() => navigate('/projects')}
            style={{ background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
          >
            + Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', backgroundColor: C.bg2, borderRadius: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text2, marginBottom: 8 }}>No projects yet</div>
          <div style={{ fontSize: 13, color: C.text3, fontFamily: 'monospace', marginBottom: 24 }}>// add projects to see them on the timeline</div>
          <button onClick={() => navigate('/projects')} style={{ background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`, color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            Add First Project
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: C.bg2, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          {/* Timeline Header */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
            {/* Project Name Column */}
            <div style={{ width: 220, flexShrink: 0, padding: '14px 20px', borderRight: `1px solid ${C.border}`, fontSize: 11, color: C.text3, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
              Project
            </div>
            {/* Month Headers */}
            <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
              {months.map((m, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, padding: '14px 12px', fontSize: 11, fontWeight: 700,
                    color: m.month === today.getMonth() && m.year === today.getFullYear() ? C.cyan : C.text3,
                    fontFamily: 'monospace', borderRight: i < months.length - 1 ? `1px solid ${C.border}` : 'none',
                    backgroundColor: m.month === today.getMonth() && m.year === today.getFullYear() ? 'rgba(6,182,212,0.05)' : 'transparent',
                  }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Project Rows */}
          {projects.map((project, idx) => {
            const barStyle = getBarStyle(project);
            const color = STATUS_COLORS[project.status] || C.cyan;
            const isLast = idx === projects.length - 1;

            return (
              <div
                key={project.id}
                style={{ display: 'flex', borderBottom: isLast ? 'none' : `1px solid ${C.border}`, minHeight: 56 }}
              >
                {/* Project Info */}
                <div style={{
                  width: 220, flexShrink: 0, padding: '12px 20px',
                  borderRight: `1px solid ${C.border}`,
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 10, color: color, backgroundColor: color + '18', padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>
                      {project.status}
                    </div>
                    <span style={{ fontSize: 10, color: C.text3, fontFamily: 'monospace' }}>{project.progress}%</span>
                  </div>
                </div>

                {/* Timeline Bar */}
                <div style={{ flex: 1, position: 'relative', padding: '8px 0' }}>
                  {/* Today line */}
                  {todayPct >= 0 && todayPct <= 100 && (
                    <div style={{
                      position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0,
                      width: 1, backgroundColor: C.cyan, opacity: 0.4, zIndex: 1,
                    }} />
                  )}

                  {/* Month grid lines */}
                  {months.map((_, i) => i > 0 && (
                    <div key={i} style={{
                      position: 'absolute', left: `${(i / viewMonths) * 100}%`,
                      top: 0, bottom: 0, width: 1,
                      backgroundColor: C.border, opacity: 0.5,
                    }} />
                  ))}

                  {/* Project Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: barStyle.left,
                      width: barStyle.width,
                      top: '50%', transform: 'translateY(-50%)',
                      height: 28, borderRadius: 6,
                      backgroundColor: color + '30',
                      border: `1px solid ${color}60`,
                      display: 'flex', alignItems: 'center',
                      overflow: 'hidden', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = color + '50'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = color + '30'}
                    onClick={() => navigate('/projects')}
                  >
                    {/* Progress fill */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${project.progress}%`,
                      backgroundColor: color + '40',
                      borderRadius: 6,
                    }} />
                    <span style={{
                      position: 'relative', fontSize: 11, fontWeight: 700,
                      color, padding: '0 8px', fontFamily: 'monospace',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {project.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Today Indicator Footer */}
          <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.cyan }} />
            <span style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace' }}>
              Today: {today.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
            <span style={{ fontSize: 11, color: C.text3 }}>{status}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 2, backgroundColor: C.cyan }} />
          <span style={{ fontSize: 11, color: C.text3 }}>Today</span>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: C.text3, fontFamily: 'monospace' }}>
          // bar fill shows % complete · click to edit
        </div>
      </div>

      {/* Project Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 24 }}>
        {projects.map(project => {
          const color = STATUS_COLORS[project.status] || C.cyan;
          const daysLeft = project.deadline
            ? Math.ceil((new Date(project.deadline) - today) / 86400000)
            : null;
          return (
            <div
              key={project.id}
              onClick={() => navigate('/projects')}
              style={{
                backgroundColor: C.bg2, borderRadius: 12, padding: 16,
                border: `1px solid ${C.border}`, cursor: 'pointer',
                borderTop: `3px solid ${color}`,
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>{project.name}</div>
                <div style={{ fontSize: 10, color, backgroundColor: color + '18', padding: '2px 8px', borderRadius: 20, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                  {project.status}
                </div>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: C.text3 }}>Progress</span>
                  <span style={{ fontSize: 10, color, fontWeight: 700, fontFamily: 'monospace' }}>{project.progress}%</span>
                </div>
                <div style={{ backgroundColor: C.border, borderRadius: 4, height: 4 }}>
                  <div style={{ backgroundColor: color, width: `${project.progress}%`, height: 4, borderRadius: 4 }} />
                </div>
              </div>

              {/* Tech Stack */}
              {project.tech_stack?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {project.tech_stack.slice(0, 3).map((tech, i) => (
                    <span key={i} style={{ fontSize: 10, color: C.text3, backgroundColor: C.bg3, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{tech}</span>
                  ))}
                </div>
              )}

              {/* Deadline */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {project.deadline ? (
                  <span style={{
                    fontSize: 11, color: daysLeft !== null && daysLeft < 7 ? C.red : daysLeft !== null && daysLeft < 30 ? C.amber : C.text3,
                    fontFamily: 'monospace',
                  }}>
                    {daysLeft !== null && daysLeft < 0 ? '⚠️ Overdue' : daysLeft !== null && daysLeft === 0 ? '🔴 Due today' : daysLeft !== null ? `📅 ${daysLeft}d left` : ''}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: C.text3 }}>No deadline</span>
                )}
                <div style={{ display: 'flex', gap: 4 }}>
                  {project.github_url && <a href={project.github_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.cyan, textDecoration: 'none' }}>⌥ GH</a>}
                  {project.live_url && <a href={project.live_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.green, textDecoration: 'none' }}>↗ Live</a>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}