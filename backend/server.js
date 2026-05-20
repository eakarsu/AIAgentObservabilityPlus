const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 4055;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4054').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('cors'))), credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'AIAgentObservabilityPlus', timestamp: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api', authenticateToken);

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
app.use('/api/custom-views', require('./routes/customViews'));

app.listen(PORT, () => console.log(`\nAgent Observability Plus API on http://localhost:${PORT}\n`));
