const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');
const { getJwtSecret } = require('./lib/security');

const app = express();
const PORT = process.env.BACKEND_PORT || 4055;
try { getJwtSecret(); } catch (error) { console.error(`Configuration error: ${error.message}`); process.exit(1); }

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const frontendPort = Number(process.env.FRONTEND_PORT || 4054);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);
if (process.env.NODE_ENV !== 'production' && Number.isInteger(frontendPort) && frontendPort >= 1 && frontendPort <= 65535) {
  allowedOrigins.push(`http://localhost:${frontendPort}`, `http://127.0.0.1:${frontendPort}`);
}
app.use(cors({ origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('cors'))), credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'AIAgentObservabilityPlus', timestamp: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api', authenticateToken);
app.use('/api', (req, res, next) => {
  const safe = req.path==='/custom-views/incident-report-pdf' || /^\/(?:projects|traces|prompts|evals|alerts|prompt-versions|eval-results|api-keys)\/(?:bulk-import|[1-9][0-9]*\/attachments)$/.test(req.path) || /^\/attachments\/[1-9][0-9]*(?:\/download)?$/.test(req.path) || /^\/notifications(?:\/(?:unread|mark-all-read|[1-9][0-9]*\/read))?$/.test(req.path) || req.path === '/dashboard' || /^\/(?:projects|traces|prompts|evals|alerts|prompt-versions|eval-results|api-keys)(?:\/[1-9][0-9]*)?$/.test(req.path) || /^\/ai\/(?:samples|history|blast-radius|regression-detect|auto-rca|drift-score|anomaly-classify|prompt-diff|cost-anomaly|eval-generator|judge-calibrator)$/.test(req.path) || req.path === '/v1/traces' || req.path === '/ai/observability-readiness' || /^\/traces\/[^/]+\/spans$/.test(req.path) || /^\/evaluations(?:\/|$)/.test(req.path) || /^\/agent-portfolio(?:\/|$)/.test(req.path);
  if (safe) return next();
  return res.status(503).json({
    error: 'Legacy global routes are disabled because they are not tenant-isolated',
    supported_workflows: ['/api/v1/traces', '/api/traces/:id/spans', '/api/evaluations'],
    action: 'Use an actor-owned native workflow; legacy global access cannot bypass source ownership.',
  });
});

// Tenant/account-owned planning records precede the disabled legacy handlers.
app.use('/api', require('./routes/ownedRecords'));
app.use('/api', require('./routes/ownedRecordExtras'));
app.use('/api/custom-views',require('./routes/ownedCustomViews'));

// CRUD entities
app.use('/api/projects', require('./routes/Projects'));
app.use('/api/traces', require('./routes/Traces'));
app.use('/api/prompts', require('./routes/Prompts'));
app.use('/api/evals', require('./routes/Evals'));
app.use('/api/alerts', require('./routes/Alerts'));
app.use('/api/prompt-versions', require('./routes/PromptVersions'));
app.use('/api/eval-results', require('./routes/EvalResults'));
app.use('/api/api-keys', require('./routes/ApiKeys'));

// AI + cross-cutting
app.use('/api/ai', require('./routes/ownedAnalysis'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use('/api', require('./routes/obsExtras'));
app.use('/api/evaluations', require('./routes/evaluationWorkflow'));
app.use('/api/custom-views', require('./routes/customViews'));
app.use('/api/blast-radius', require('./routes/blastRadiusAnalyzer'));
app.use('/api/agent-portfolio', require('./routes/agentPortfolio'));

app.listen(PORT, () => console.log(`\nAgent Observability Plus API on http://localhost:${PORT}\n`));
