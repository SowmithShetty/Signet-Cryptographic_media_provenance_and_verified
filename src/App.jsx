import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import IngestPage from './pages/IngestPage';
import PlaceholderPage from './pages/PlaceholderPage';

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<IngestPage />} />
        <Route path="analysis" element={<PlaceholderPage title="Forensic Analysis" />} />
        <Route path="monitoring" element={<PlaceholderPage title="Threat Monitoring" />} />
        <Route path="audit-log" element={<PlaceholderPage title="Audit Log" />} />
        <Route path="terminal" element={<PlaceholderPage title="Forensic Terminal" />} />
        <Route path="settings" element={<PlaceholderPage title="System Settings" />} />
      </Route>
    </Routes>
  );
}
