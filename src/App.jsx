import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import IngestPage from './pages/IngestPage';
import ProvenancePage from './pages/ProvenancePage';
import PlaceholderPage from './pages/PlaceholderPage';
import { ValidationProvider } from './context/ValidationContext';

export default function App() {
  return (
    <ValidationProvider>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<IngestPage />} />
          <Route path="provenance" element={<ProvenancePage />} />
          <Route path="analysis" element={<PlaceholderPage title="Forensic Analysis" />} />
          <Route path="monitoring" element={<PlaceholderPage title="Threat Monitoring" />} />
          <Route path="audit-log" element={<PlaceholderPage title="Audit Log" />} />
          <Route path="terminal" element={<PlaceholderPage title="Forensic Terminal" />} />
          <Route path="settings" element={<PlaceholderPage title="System Settings" />} />
        </Route>
      </Routes>
    </ValidationProvider>
  );
}

