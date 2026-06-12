import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ToastProvider } from './hooks/useToast.jsx';
import { SettingsProvider, useSettings } from './hooks/useSettings.jsx';
import AppShell from './components/AppShell.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import LeadDetail from './pages/LeadDetail.jsx';
import Capture from './pages/Capture.jsx';
import Team from './pages/Team.jsx';
import Channel from './pages/Channel.jsx';
import Reports from './pages/Reports.jsx';
import Access from './pages/Access.jsx';
import Personalisation from './pages/Personalisation.jsx';
import { useEffect } from 'react';

// After login, reload settings from server
function SettingsReloader() {
  const { user } = useAuth();
  const { reload } = useSettings();
  useEffect(() => {
    if (user) reload();
  }, [user?._id]);
  return null;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="capture" element={<Capture />} />
        <Route path="team" element={<Team />} />
        <Route path="channel" element={<Channel />} />
        <Route path="reports" element={<Reports />} />
        <Route path="access" element={<Access />} />
        <Route path="personalisation" element={<Personalisation />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <SettingsProvider>
            <SettingsReloader />
            <AppRoutes />
          </SettingsProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
