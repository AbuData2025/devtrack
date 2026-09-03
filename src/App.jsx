import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Projects from './screens/Projects';
import JobTracker from './screens/JobTracker';
import Analytics from './screens/Analytics';
import Focus from './screens/Focus';
import WeeklyReport from './screens/WeeklyReport';
import Timeline from './screens/Timeline';
import InterviewPrep from './screens/InterviewPrep';
import { ThemeProvider } from './context/ThemeContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 40 }}>⚡</div>
      <div style={{ color: '#9898b0', fontSize: 15 }}>Loading DevTrack...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/jobs" element={<JobTracker />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/weekly-report" element={<WeeklyReport />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/interview-prep" element={<InterviewPrep />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}