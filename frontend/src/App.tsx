import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewInterviewWizardPage } from './pages/NewInterviewWizardPage';
import { ActiveInterviewPage } from './pages/ActiveInterviewPage';
import { ReportPage } from './pages/ReportPage';
import { HistoryPage } from './pages/HistoryPage';
import { ArchitecturePage } from './pages/ArchitecturePage';

export const App: React.FC = () => {
  // Hackathon Debug Mode state (defaults to true if VITE_DEMO_DEBUG=true or can be toggled by judges in navbar)
  const initialDebug = import.meta.env.VITE_DEMO_DEBUG === 'true' || true;
  const [debugMode, setDebugMode] = useState<boolean>(initialDebug);

  const handleToggleDebug = () => {
    setDebugMode((prev) => !prev);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-brand-500 selection:text-white">
        <Navbar debugMode={debugMode} onToggleDebug={handleToggleDebug} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/new"
              element={
                <ProtectedRoute>
                  <NewInterviewWizardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:id"
              element={
                <ProtectedRoute>
                  <ActiveInterviewPage debugMode={debugMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:id"
              element={
                <ProtectedRoute>
                  <ReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
