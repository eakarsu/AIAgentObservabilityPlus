const express = require('express');
const router = express.Router();

function analyzeTrace(trace) {
  const users = Number(trace.affected_users ?? 0);
  const tools = Number(trace.tool_count ?? 1);
  const retries = Number(trace.retry_count ?? 0);
  const cost = Number(trace.cost_usd ?? 0);
  const severity = String(trace.severity || 'medium').toLowerCase();
  const severityWeight = { low: 6, medium: 16, high: 28, critical: 40 }[severity] || 16;
  const score = Math.min(100, Math.round(Math.log10(users + 1) * 18 + tools * 5 + retries * 6 + cost * 3 + severityWeight));
  return {
    trace_id: trace.trace_id || trace.id || 'trace',
    project: trace.project || 'unassigned',
    score,
    tier: score >= 80 ? 'sev1' : score >= 60 ? 'sev2' : score >= 40 ? 'sev3' : 'watch',
    containment: score >= 60 ? 'Disable risky prompt version, replay failed spans, and notify project owner.' : 'Keep trace sampled and compare against next deploy.',
  };
}

router.post('/analyze', (req, res) => {
  const traces = Array.isArray(req.body?.traces) ? req.body.traces : [];
  const rows = (traces.length ? traces : [
    { trace_id: 'tr_91', project: 'Support Agent', affected_users: 420, tool_count: 5, retry_count: 3, cost_usd: 22, severity: 'high' },
    { trace_id: 'tr_92', project: 'Billing Agent', affected_users: 38, tool_count: 2, retry_count: 1, cost_usd: 7, severity: 'medium' }
  ]).map(analyzeTrace).sort((a, b) => b.score - a.score);
  res.json({
    maxScore: rows[0]?.score || 0,
    sev1Count: rows.filter((row) => row.tier === 'sev1').length,
    analyzedAt: new Date().toISOString(),
    traces: rows,
  });
});

module.exports = router;
