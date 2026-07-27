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
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4054').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('cors'))), credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'AIAgentObservabilityPlus', timestamp: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api', authenticateToken);
app.use('/api', (req, res, next) => {
  const safe = req.path === '/v1/traces' || req.path === '/ai/observability-readiness' || /^\/traces\/[^/]+\/spans$/.test(req.path) || /^\/evaluations(?:\/|$)/.test(req.path) || /^\/agent-portfolio(?:\/|$)/.test(req.path);
  if (process.env.ENABLE_LEGACY_GLOBAL_ROUTES === 'true' || safe) return next();
  return res.status(503).json({
    error: 'Legacy global routes are disabled because they are not tenant-isolated',
    supported_workflows: ['/api/v1/traces', '/api/traces/:id/spans', '/api/evaluations'],
    development_override: 'ENABLE_LEGACY_GLOBAL_ROUTES=true',
  });
});

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
