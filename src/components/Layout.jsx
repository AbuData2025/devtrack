import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { signOut } from '../lib/auth';
import CommandPalette from './CommandPalette';

const NAV = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/projects', icon: '◈', label: 'Projects' },
  { path: '/jobs', icon: '◎', label: 'Jobs' },
  { path: '/analytics', icon: '◉', label: 'Analytics' },
  { path: '/focus', icon: '◌', label: 'Focus' },
  { path: '/weekly-report', icon: '📋', label: 'Weekly Report' },
  { path: '/timeline', icon: '▤', label: 'Timeline' },
  { path: '/interview-prep', icon: '🎤', label: 'Interview Prep' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme: C, mode, toggle } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

 const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Developer';
const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900, color: 'white',
            boxShadow: '0 0 12px rgba(6,182,212,0.3)', fontFamily: 'monospace',
          }}>
            {'</>'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.text, letterSpacing: 0.5 }}>DevTrack</div>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: 1.5, textTransform: 'uppercase' }}>Dev OS</div>
          </div>
          {/* Theme Toggle */}
          <button
            onClick={toggle}
            style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 14, color: C.text2 }}
            title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Command Palette Trigger */}
        <div
          onClick={() => setPaletteOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: C.bg3, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.cyan}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          <span style={{ fontSize: 13, color: C.text3 }}>⌕</span>
          <span style={{ fontSize: 12, color: C.text3, flex: 1, fontFamily: 'monospace' }}>Search...</span>
          <kbd style={{ fontSize: 10, color: C.text3, backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 5px' }}>⌘K</kbd>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '0 10px', overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = location.pathname === item.path;
          return (
            <div
              key={item.path}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                marginBottom: 2,
                backgroundColor: active ? (mode === 'dark' ? 'rgba(6,182,212,0.1)' : 'rgba(8,145,178,0.1)') : 'transparent',
                color: active ? C.cyan : C.text3,
                borderLeft: `2px solid ${active ? C.cyan : 'transparent'}`,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* User */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16,
            background: 'linear-gradient(135deg, #06b6d4, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: 'white',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.user_metadata?.full_name || user?.email}
            </div>
            <div style={{ fontSize: 10, color: C.green }}>● Active</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{ width: '100%', padding: '7px', borderRadius: 8, border: `1px solid ${C.border}`, backgroundColor: 'transparent', color: C.text3, fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}
        >
          $ logout
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: C.bg }}>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Mobile Header */}
      <div style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        backgroundColor: C.bg2, borderBottom: `1px solid ${C.border}`,
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between',
      }}
        className="mobile-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: 'white', fontFamily: 'monospace' }}>
            {'</>'}
          </div>
          <span style={{ fontSize: 15, fontWeight: 900, color: C.text }}>DevTrack</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={toggle} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 14 }}>
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 18, color: C.text }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 299 }}
        />
      )}

      {/* Sidebar — Desktop always visible, Mobile slide in */}
      <div style={{
        width: 220, backgroundColor: C.bg2,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        padding: '24px 0', position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 300,
        transition: 'transform 0.25s ease',
      }}
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
      >
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 220, flex: 1, minHeight: '100vh', backgroundColor: C.bg }}
        className="main-content"
      >
        <Outlet />
      </div>

      {/* CSS for mobile */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          .sidebar { transform: translateX(-100%); top: 0 !important; }
          .sidebar.sidebar-open { transform: translateX(0); }
          .main-content { margin-left: 0 !important; padding-top: 60px; }
        }
      `}</style>
    </div>
  );
}