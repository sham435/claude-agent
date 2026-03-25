// src/App.tsx

import React, { useEffect } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AgentChat from './pages/Chat';
import ImagePage from './pages/Image';
import PDFPage from './pages/PDF';
import PPTPage from './pages/PPT';
import ToolExplorer from './pages/Tools';
import ExecutionMonitor from './pages/Executions';
import ModelPanel from './pages/Models';
import VersionControlPage from './pages/VersionControl';
import SettingsPanel from './pages/Settings';
import { useLoadingStore } from './stores/index';
import { apiClient } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const setError = useLoadingStore((state) => state.setError);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const isHealthy = await apiClient.healthCheck();
        if (!isHealthy) {
          setError('Backend is not responding');
        }
      } catch (error) {
        setError('Cannot connect to backend server');
      }
    };
    checkHealth();
  }, [setError]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<AgentChat />} />
              <Route path="/image" element={<ImagePage />} />
              <Route path="/pdf" element={<PDFPage />} />
              <Route path="/ppt" element={<PPTPage />} />
              <Route path="/tools" element={<ToolExplorer />} />
              <Route path="/executions" element={<ExecutionMonitor />} />
              <Route path="/models" element={<ModelPanel />} />
              <Route path="/versions" element={<VersionControlPage />} />
              <Route path="/settings" element={<SettingsPanel />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

