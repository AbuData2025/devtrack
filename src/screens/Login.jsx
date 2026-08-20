import { useState } from 'react';
import { signInWithGoogle } from '../lib/auth';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (e) {
      setError('Could not sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#080810',
      display: 'flex',
      overflow: 'hidden',
    }}>
      {/* Left Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
        borderRight: '1px solid #1e2035',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: 'white',
              boxShadow: '0 0 20px rgba(6,182,212,0.4)',
            }}>
              {'</>'}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f0f0ff', letterSpacing: 1 }}>DevTrack</div>
              <div style={{ fontSize: 11, color: '#4a4a6a', letterSpacing: 2, textTransform: 'uppercase' }}>Developer OS</div>
            </div>
          </div>

          <div style={{ fontSize: 42, fontWeight: 900, color: '#f0f0ff', lineHeight: 1.2, marginBottom: 16 }}>
            Your developer<br />
            <span style={{ color: '#06b6d4' }}>command center.</span>
          </div>
          <div style={{ fontSize: 16, color: '#6a6a8a', lineHeight: 1.7, maxWidth: 400 }}>
            Track projects, log coding sessions, manage job applications and stay focused — all in one place built for developers.
          </div>
        </div>

        {/* Terminal-style stats */}
        <div style={{
          backgroundColor: '#0d0d1a',
          border: '1px solid #1e2035',
          borderRadius: 14,
          padding: 24,
          fontFamily: 'monospace',
          maxWidth: 440,
        }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#e85555' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#f5a623' }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c983' }} />
          </div>
          {[
            { prefix: '~$', command: 'devtrack --status', color: '#06b6d4' },
            { prefix: '>', text: 'Projects tracked:', value: '12', color: '#10b981' },
            { prefix: '>', text: 'Jobs applied:', value: '47', color: '#10b981' },
            { prefix: '>', text: 'Coding streak:', value: '15 days 🔥', color: '#10b981' },
            { prefix: '>', text: 'Focus sessions:', value: '89', color: '#10b981' },
          ].map((line, i) => (
            <div key={i} style={{ marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: '#4a4a6a' }}>{line.prefix} </span>
              {line.command ? (
                <span style={{ color: line.color }}>{line.command}</span>
              ) : (
                <>
                  <span style={{ color: '#6a6a8a' }}>{line.text} </span>
                  <span style={{ color: line.color, fontWeight: 700 }}>{line.value}</span>
                </>
              )}
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <span style={{ color: '#4a4a6a' }}>~ </span>
            <span style={{ color: '#06b6d4', animation: 'blink 1s infinite' }}>█</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        width: 480,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 60px',
        backgroundColor: '#0a0a14',
      }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#f0f0ff', marginBottom: 8 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: '#6a6a8a' }}>Sign in to access your developer dashboard</div>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {[
            { icon: '◈', label: 'Project Tracker', sub: 'Track builds with progress & tech stack', color: '#06b6d4' },
            { icon: '📊', label: 'GitHub Analytics', sub: 'Live stats, streaks & language breakdown', color: '#10b981' },
            { icon: '💼', label: 'Job Pipeline', sub: 'From Applied to Offer in one view', color: '#818cf8' },
            { icon: '🎯', label: 'Focus Mode', sub: 'Pomodoro timer + daily goals', color: '#f5a623' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12,
              backgroundColor: '#0d0d1a', border: '1px solid #1e2035',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: f.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: f.color, flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0ff' }}>{f.label}</div>
                <div style={{ fontSize: 11, color: '#4a4a6a', marginTop: 1 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(232,85,85,0.1)', border: '1px solid rgba(232,85,85,0.3)',
            borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'center',
          }}>
            <span style={{ color: '#e85555', fontSize: 13 }}>{error}</span>
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', backgroundColor: 'white', color: '#0a0a14',
            border: 'none', borderRadius: 12, padding: '14px 20px',
            fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            opacity: loading ? 0.7 : 1, marginBottom: 14,
            boxShadow: '0 4px 20px rgba(255,255,255,0.1)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#4a4a6a', lineHeight: 1.6 }}>
          Secured by Supabase · Your data stays private<br />
          Built for developers, by a developer
        </div>
      </div>
    </div>
  );
}