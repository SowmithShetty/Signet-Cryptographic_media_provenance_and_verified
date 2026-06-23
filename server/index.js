import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'operational',
    service: 'SIGNET Forensic Analysis Engine',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

// Placeholder: future endpoints will be added here
// POST /api/analyze  — submit file for forensic analysis
// GET  /api/reports   — retrieve analysis reports
// GET  /api/reports/:id — retrieve single report

app.listen(PORT, () => {
  console.log(`[SIGNET] Server operational on port ${PORT}`);
});
