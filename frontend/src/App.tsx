import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Overview } from './pages/Overview';
import { SubmitReport } from './pages/SubmitReport';
import { UserDashboard } from './pages/UserDashboard';
import { HandlerDashboard } from './pages/HandlerDashboard';
import { RoutingManagement } from './pages/RoutingManagement';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { DFASimulator } from './pages/DFASimulator';
import { TestCases } from './pages/TestCases';
import { LoginPage } from './pages/LoginPage';

// Protected layout wrapper
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#070b14] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 bg-[#0b1120]">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<Layout><Overview /></Layout>} />
          <Route path="/submit" element={<Layout><SubmitReport /></Layout>} />
          <Route path="/my-reports" element={<Layout><UserDashboard /></Layout>} />
          <Route path="/handler" element={<Layout><HandlerDashboard /></Layout>} />
          <Route path="/routing" element={<Layout><RoutingManagement /></Layout>} />
          <Route path="/analytics" element={<Layout><AnalyticsDashboard /></Layout>} />
          <Route path="/dfa-simulator" element={<Layout><DFASimulator /></Layout>} />
          <Route path="/test-cases" element={<Layout><TestCases /></Layout>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
