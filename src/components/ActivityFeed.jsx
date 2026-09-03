import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';



const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
};

export default function ActivityFeed({ limit = 20, compact = false }) {
  const { theme: C } = useTheme();
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadActivities();
  }, [user]);

  const loadActivities = async () => {
    const { data } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    setActivities(data || []);
    setLoading(false);
  };

  if (loading) return (
    <div style={{ color: C.text3, fontFamily: 'monospace', fontSize: 12 }}>// loading activity...</div>
  );

  if (activities.length === 0) return (
    <div style={{ textAlign: 'center', padding: compact ? '16px 0' : '40px 0' }}>
      <div style={{ fontSize: compact ? 24 : 32, marginBottom: 8 }}>📡</div>
      <div style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace' }}>// no activity yet</div>
      <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>Start logging sessions, adding jobs or completing goals</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {activities.map((activity, i) => (
        <div
          key={activity.id}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: compact ? '8px 0' : '12px 0',
            borderBottom: i < activities.length - 1 ? `1px solid ${C.bg3}` : 'none',
          }}
        >
          {/* Icon */}
          <div style={{
            width: compact ? 30 : 36, height: compact ? 30 : 36,
            borderRadius: compact ? 8 : 10, flexShrink: 0,
            backgroundColor: (activity.color || C.cyan) + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: compact ? 14 : 16,
          }}>
            {activity.icon || '📌'}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: C.text, fontFamily: 'monospace' }}>
              {activity.title}
            </div>
            {activity.subtitle && (
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{activity.subtitle}</div>
            )}
          </div>

          {/* Time */}
          <div style={{ fontSize: 10, color: C.text3, fontFamily: 'monospace', flexShrink: 0, marginTop: 2 }}>
            {timeAgo(activity.created_at)}
          </div>
        </div>
      ))}
    </div>
  );
}