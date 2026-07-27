import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import TracesPage from './pages/TracesPage';
import PromptsPage from './pages/PromptsPage';
import EvalsPage from './pages/EvalsPage';
import AlertsPage from './pages/AlertsPage';
import PromptVersionsPage from './pages/PromptVersionsPage';
import EvalResultsPage from './pages/EvalResultsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import AIRegressionDetectPage from './pages/AIRegressionDetectPage';
import AIAutoRcaPage from './pages/AIAutoRcaPage';
import AIDriftScorePage from './pages/AIDriftScorePage';
import AIAnomalyClassifyPage from './pages/AIAnomalyClassifyPage';
import AIPromptDiffPage from './pages/AIPromptDiffPage';
import AICostAnomalyPage from './pages/AICostAnomalyPage';
import AIEvalGeneratorPage from './pages/AIEvalGeneratorPage';
import AIJudgeCalibratorPage from './pages/AIJudgeCalibratorPage';
import TraceViewerWorkbench from './pages/TraceViewerWorkbench';
import OtlpIngestWorkbench from './pages/OtlpIngestWorkbench';
import CustomViewsPage from './pages/CustomViewsPage';
import { getToken } from './services/api';
import './App.css';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';
import BlastRadiusAnalyzerPage from './pages/BlastRadiusAnalyzerPage';
import ProductionControlsPage from './pages/ProductionControlsPage';
import AgentPortfolioPage from './pages/AgentPortfolioPage';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function Shell() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <Topbar />
        <div style={{ padding: '24px 32px' }}>
          <Routes>
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/traces" element={<TracesPage />} />
            <Route path="/prompts" element={<PromptsPage />} />
            <Route path="/evals" element={<EvalsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/prompt-versions" element={<PromptVersionsPage />} />
            <Route path="/eval-results" element={<EvalResultsPage />} />
            <Route path="/api-keys" element={<ApiKeysPage />} />
            <Route path="/ai/regression-detect" element={<AIRegressionDetectPage />} />
            <Route path="/ai/auto-rca" element={<AIAutoRcaPage />} />
            <Route path="/ai/drift-score" element={<AIDriftScorePage />} />
            <Route path="/ai/anomaly-classify" element={<AIAnomalyClassifyPage />} />
            <Route path="/ai/prompt-diff" element={<AIPromptDiffPage />} />
            <Route path="/ai/cost-anomaly" element={<AICostAnomalyPage />} />
            <Route path="/ai/eval-generator" element={<AIEvalGeneratorPage />} />
            <Route path="/ai/judge-calibrator" element={<AIJudgeCalibratorPage />} />
            <Route path="/wb/trace-viewer" element={<TraceViewerWorkbench />} />
            <Route path="/wb/otlp-ingest" element={<OtlpIngestWorkbench />} />
            <Route path="/custom-views" element={<CustomViewsPage />} />
            <Route path="/blast-radius" element={<BlastRadiusAnalyzerPage />} />
            <Route path="/production-controls" element={<ProductionControlsPage />} />
            <Route path="/agent-portfolio" element={<AgentPortfolioPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<RequireAuth><Shell /></RequireAuth>} />
      </Routes>
    </Router>
  );
}
