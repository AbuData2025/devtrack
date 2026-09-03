import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logActivity, ACTIVITY_TYPES } from '../lib/activity';
import { useTheme } from '../context/ThemeContext';

const QUOTES = [
  'The secret of getting ahead is getting started.',
  'Code is like humor. When you have to explain it, it\'s bad.',
  'Every expert was once a beginner.',
  'Push yourself, because no one else is going to do it for you.',
  'Small steps every day lead to big results.',
  'Your only limit is you.',
  'Dream it. Code it. Ship it.',
  'Consistency beats perfection every time.',
];

const getTodayKey = () => new Date().toISOString().split('T')[0];

export default function Focus() {
  const { theme: C } = useTheme();
  const { user } = useAuth();

  const POMODORO_MODES = [
    { label: 'Focus', minutes: 25, color: C.cyan },
    { label: 'Short Break', minutes: 5, color: C.green },
    { label: 'Long Break', minutes: 15, color: C.purple },
  ];

  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [notes, setNotes] = useState('');

  const [pomodoroMode, setPomodoroMode] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customDuration, setCustomDuration] = useState(null);

  const intervalRef = useRef(null);

  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  const mode = POMODORO_MODES[pomodoroMode];

  // Load goals and notes
  useEffect(() => {
    if (user) loadGoals();

    const savedNotes = localStorage.getItem('focusNotes');

    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [user]);

  // Reset timer when switching between preset modes
  useEffect(() => {
    setTimeLeft(POMODORO_MODES[pomodoroMode].minutes * 60);
    setCustomDuration(null);
    setRunning(false);
    clearInterval(intervalRef.current);
  }, [pomodoroMode]);

  // Timer
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setSessions((s) => s + 1);

            playAlarm();

            if (Notification.permission === 'granted') {
              new Notification('⏰ Pomodoro Complete!', {
                body: 'Time for a break. Well done!',
              });
            }

            return 0;
          }

          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [running]);

  const loadGoals = async () => {
    const { data } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date_key', getTodayKey())
      .order('created_at', { ascending: true });

    setGoals(data || []);
  };

  const addGoal = async (e) => {
    e.preventDefault();

    if (!newGoal.trim()) return;

    const goal = {
      user_id: user.id,
      date_key: getTodayKey(),
      text: newGoal.trim(),
      completed: false,
    };

    const { data } = await supabase
      .from('daily_goals')
      .insert(goal)
      .select()
      .single();

    if (data) {
      setGoals([...goals, data]);
    }

    setNewGoal('');
  };

  const toggleGoal = async (goal) => {
    const newVal = !goal.completed;

    await supabase
      .from('daily_goals')
      .update({ completed: newVal })
      .eq('id', goal.id);

    setGoals(
      goals.map((g) =>
        g.id === goal.id ? { ...g, completed: newVal } : g
      )
    );

    if (newVal) {
      await logActivity(user.id, {
        type: ACTIVITY_TYPES.GOAL_COMPLETED,
        title: `Completed: ${goal.text}`,
        subtitle: 'Daily goal',
        icon: '✅',
        color: '#10b981',
      });
    }
  };

  const deleteGoal = async (id) => {
    await supabase
      .from('daily_goals')
      .delete()
      .eq('id', id);

    setGoals(goals.filter((g) => g.id !== id));
  };

  const saveNotes = (val) => {
    setNotes(val);
    localStorage.setItem('focusNotes', val);
  };

  const resetTimer = () => {
    setRunning(false);

    if (customDuration) {
      setTimeLeft(customDuration);
    } else {
      setTimeLeft(mode.minutes * 60);
    }
  };

  const playAlarm = () => {
    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      const audioCtx = new AudioContext();

      const beep = (freq, start, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sine';

        osc.frequency.setValueAtTime(
          freq,
          audioCtx.currentTime + start
        );

        gain.gain.setValueAtTime(
          0.3,
          audioCtx.currentTime + start
        );

        gain.gain.exponentialRampToValueAtTime(
          0.01,
          audioCtx.currentTime + start + duration
        );

        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };

      // Three-beep alarm
      beep(880, 0, 0.3);
      beep(880, 0.4, 0.3);
      beep(1100, 0.8, 0.6);
    } catch (e) {
      console.log('Audio not supported:', e);
    }
  };

  const mins = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');

  const secs = (timeLeft % 60)
    .toString()
    .padStart(2, '0');

  const totalDuration =
    customDuration || mode.minutes * 60;

  const progress = 1 - timeLeft / totalDuration;

  const completedGoals = goals.filter(
    (g) => g.completed
  ).length;

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: C.text,
          }}
        >
          Daily Focus
        </div>

        <div
          style={{
            fontSize: 13,
            color: C.text3,
            marginTop: 4,
            fontFamily: 'monospace',
          }}
        >
          // "{quote}"
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Pomodoro */}
        <div
          style={{
            backgroundColor: C.bg2,
            borderRadius: 16,
            padding: 32,
            border: `1px solid ${C.border}`,
            textAlign: 'center',
          }}
        >
          {/* Mode Selector */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 20,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {POMODORO_MODES.map((m, i) => (
              <button
                key={i}
                onClick={() => {
                  setPomodoroMode(i);
                  setCustomDuration(null);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  backgroundColor:
                    pomodoroMode === i
                      ? m.color + '25'
                      : C.bg3,
                  color:
                    pomodoroMode === i
                      ? m.color
                      : C.text3,
                  fontSize: 12,
                  fontWeight: 700,
                  border: `1px solid ${
                    pomodoroMode === i
                      ? m.color
                      : C.border
                  }`,
                }}
              >
                {m.label}
              </button>
            ))}

            {/* Custom Timer Button */}
            <button
              onClick={() => setShowCustom(!showCustom)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                cursor: 'pointer',
                backgroundColor: showCustom
                  ? C.cyan + '25'
                  : C.bg3,
                color: showCustom
                  ? C.cyan
                  : C.text3,
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${
                  showCustom
                    ? C.cyan
                    : C.border
                }`,
              }}
            >
              ⚙️ Custom
            </button>
          </div>

          {/* Custom Timer Input */}
          {showCustom && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <input
                type="number"
                min="1"
                max="120"
                placeholder="Minutes"
                value={customMinutes}
                onChange={(e) =>
                  setCustomMinutes(e.target.value)
                }
                style={{
                  backgroundColor: C.bg3,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '8px 14px',
                  color: C.text,
                  fontSize: 14,
                  outline: 'none',
                  width: 100,
                  fontFamily: 'monospace',
                  textAlign: 'center',
                }}
              />

              <button
                onClick={() => {
                  const mins = parseInt(customMinutes);

                  if (
                    !mins ||
                    mins < 1 ||
                    mins > 120
                  ) {
                    alert(
                      'Please enter a time between 1 and 120 minutes.'
                    );
                    return;
                  }

                  setTimeLeft(mins * 60);
                  setCustomDuration(mins * 60);
                  setRunning(false);
                  setShowCustom(false);
                  setCustomMinutes('');
                }}
                style={{
                  background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Set Timer
              </button>
            </div>
          )}

          {/* Timer Circle */}
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              marginBottom: 28,
            }}
          >
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
            >
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke={C.border}
                strokeWidth="6"
              />

              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke={mode.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${
                  2 *
                  Math.PI *
                  88 *
                  (1 - progress)
                }`}
                transform="rotate(-90 100 100)"
                style={{
                  transition:
                    'stroke-dashoffset 1s linear',
                }}
              />
            </svg>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 46,
                  fontWeight: 900,
                  color: C.text,
                  fontFamily: 'monospace',
                }}
              >
                {mins}:{secs}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: mode.color,
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                {customDuration
                  ? 'Custom Timer'
                  : mode.label}
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <button
              onClick={() => setRunning(!running)}
              style={{
                background: `linear-gradient(135deg, ${mode.color}, ${mode.color}99)`,
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '12px 28px',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {running ? '⏸ Pause' : '▶ Start'}
            </button>

            <button
              onClick={resetTimer}
              style={{
                backgroundColor: C.bg3,
                color: C.text2,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: 15,
              }}
            >
              ↺
            </button>
          </div>

          {/* Session Counter */}
          {sessions > 0 && (
            <div
              style={{
                fontSize: 13,
                color: C.amber,
                fontFamily: 'monospace',
              }}
            >
              🍅 {sessions} pomodoro
              {sessions > 1 ? 's' : ''} today
            </div>
          )}
        </div>

        {/* Goals */}
        <div
          style={{
            backgroundColor: C.bg2,
            borderRadius: 16,
            padding: 24,
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: C.text,
              marginBottom: 20,
            }}
          >
            Today's Goals
          </div>

          <form
            onSubmit={addGoal}
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <input
              value={newGoal}
              onChange={(e) =>
                setNewGoal(e.target.value)
              }
              placeholder="Add a goal..."
              style={{
                flex: 1,
                backgroundColor: C.bg3,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 14px',
                color: C.text,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />

            <button
              type="submit"
              style={{
                background: `linear-gradient(135deg, ${C.cyan}, #0891b2)`,
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              +
            </button>
          </form>

          {/* Goal Progress */}
          {goals.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: C.text3,
                  }}
                >
                  {completedGoals} of {goals.length}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: C.cyan,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  {Math.round(
                    (completedGoals / goals.length) * 100
                  )}
                  %
                </span>
              </div>

              <div
                style={{
                  backgroundColor: C.border,
                  borderRadius: 4,
                  height: 4,
                }}
              >
                <div
                  style={{
                    background: `linear-gradient(90deg, ${C.cyan}, ${C.green})`,
                    width: `${
                      (completedGoals /
                        goals.length) *
                      100
                    }%`,
                    height: 4,
                    borderRadius: 4,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          )}

          {/* Goal List */}
          <div
            style={{
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {goals.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 0',
                  color: C.text3,
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}
              >
                // no goals yet
              </div>
            ) : (
              goals.map((goal) => (
                <div
                  key={goal.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 0',
                    borderBottom: `1px solid ${C.bg3}`,
                  }}
                >
                  <div
                    onClick={() =>
                      toggleGoal(goal)
                    }
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      flexShrink: 0,
                      cursor: 'pointer',
                      background: goal.completed
                        ? `linear-gradient(135deg, ${C.cyan}, ${C.green})`
                        : 'transparent',
                      border: `2px solid ${
                        goal.completed
                          ? C.cyan
                          : C.border
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {goal.completed && (
                      <span
                        style={{
                          color: 'white',
                          fontSize: 11,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontFamily: 'monospace',
                      color: goal.completed
                        ? C.text3
                        : C.text,
                      textDecoration:
                        goal.completed
                          ? 'line-through'
                          : 'none',
                    }}
                  >
                    {goal.text}
                  </span>

                  <button
                    onClick={() =>
                      deleteGoal(goal.id)
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.text3,
                      cursor: 'pointer',
                      fontSize: 16,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div
        style={{
          backgroundColor: C.bg2,
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: C.text,
            marginBottom: 16,
          }}
        >
          📝 Quick Notes
        </div>

        <textarea
          value={notes}
          onChange={(e) =>
            saveNotes(e.target.value)
          }
          placeholder="// write down ideas, tasks, reminders..."
          style={{
            width: '100%',
            height: 160,
            backgroundColor: C.bg3,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 16,
            color: C.text,
            fontSize: 13,
            resize: 'none',
            outline: 'none',
            lineHeight: 1.7,
            fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        />

        <div
          style={{
            fontSize: 11,
            color: C.text3,
            marginTop: 8,
            fontFamily: 'monospace',
          }}
        >
          // auto-saved to browser
        </div>
      </div>
    </div>
  );
}