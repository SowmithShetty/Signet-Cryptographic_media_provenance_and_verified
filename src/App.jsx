import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import IngestPage from './pages/IngestPage';
import ProvenancePage from './pages/ProvenancePage';
import AnalysisPage from './pages/AnalysisPage';
import MonitoringPage from './pages/MonitoringPage';
import AuditLogPage from './pages/AuditLogPage';
import TerminalPage from './pages/TerminalPage';
import SettingsPage from './pages/SettingsPage';
import { ValidationProvider } from './context/ValidationContext';

export default function App() {
  return (
    <ValidationProvider>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<IngestPage />} />
          <Route path="provenance" element={<ProvenancePage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="terminal" element={<TerminalPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </ValidationProvider>
  );
}


