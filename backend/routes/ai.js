const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

router.get('/observability-readiness', async (req, res) => {
  if (!req.user?.tenant_id || !req.user?.id) return res.status(403).json({ error: 'An actual tenant-bound identity is required' });
  try {
    const saved = await pool.query('SELECT id,input,output,created_at,provider_model FROM ai_results WHERE feature=$1 AND tenant_id=$2 AND user_id=$3 AND provider_request_id IS NOT NULL ORDER BY created_at DESC,id DESC LIMIT 100', ['observability_readiness', req.user.tenant_id, req.user.id]);
    return res.json({ items: saved.rows, retained: true, canDelete: false });
  } catch (_) { return res.status(500).json({ error: 'Could not load owned provider reports' }); }
});
router.post('/observability-readiness', async (req, res) => {
  const workflowSummary = typeof req.body?.workflowSummary === 'string' ? req.body.workflowSummary.trim() : '';
  if (workflowSummary.length < 10 || workflowSummary.length > 1000) return res.status(400).json({ error: 'workflowSummary must contain 10-1000 characters' });
  if (!req.user?.tenant_id || !req.user?.id) return res.status(403).json({ error: 'An actual tenant-bound identity is required' });
  const controller = new AbortController(), abort = () => { if (!res.writableEnded) controller.abort(); };
  req.once('aborted', abort); res.once('close', abort); if (req.aborted || res.destroyed) controller.abort();
  let client;
  try {
    controller.signal.throwIfAborted();
    const evidence = await ai.callOpenRouterEvidence(
      'You review AI observability operations only. Return JSON with exactly three concise controls for trace provenance, evaluation authorization, and human incident review. Do not invent telemetry.',
      `Review this de-identified workflow: ${workflowSummary}`, { signal: controller.signal }
    );
    controller.signal.throwIfAborted(); client = await pool.connect(); await client.query('BEGIN'); controller.signal.throwIfAborted();
    const saved = await client.query(
      `INSERT INTO ai_results(feature,input,output,tenant_id,user_id,provider_request_id,provider_model,result_text)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,created_at`,
      ['observability_readiness', { workflowSummary }, evidence, req.user.tenant_id, req.user.id, evidence.providerReceipt.requestId, evidence.providerReceipt.model, evidence.result]
    );
    controller.signal.throwIfAborted(); await client.query('COMMIT');
    return res.json({ analysisId: saved.rows[0].id, createdAt: saved.rows[0].created_at, ...evidence });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    if (controller.signal.aborted || res.destroyed) return;
    return res.status(502).json({ error: 'AI provider request failed' });
  } finally { client?.release(); req.off('aborted', abort); res.off('close', abort); }
});

const { SCHEMAS, SAMPLES } = require('./analysisDefinitions');

async function record(feature, input, output) {
  try {
    await pool.query('INSERT INTO ai_results (feature, input, output) VALUES ($1, $2, $3)',
      [feature, input || {}, output || {}]);
  } catch (e) { console.warn('[ai] record failed:', e.message); }
}

router.get('/samples', (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    if (!feature) return res.json({ features: Object.keys(SAMPLES) });
    const samples = SAMPLES[feature];
    if (!samples) return res.status(404).json({ error: `unknown feature: ${feature}` });
    res.json({ feature, samples });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/history', async (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    const r = feature
      ? await pool.query('SELECT id, feature, input, output, created_at FROM ai_results WHERE feature=$1 ORDER BY created_at DESC LIMIT $2', [feature, limit])
      : await pool.query('SELECT id, feature, input, output, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/regression-detect', async (req, res) => {
  try {
    const result = await ai.runFeature('regression-detect', SCHEMAS['regression-detect'], req.body || {});
    await record('regression-detect', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/auto-rca', async (req, res) => {
  try {
    const result = await ai.runFeature('auto-rca', SCHEMAS['auto-rca'], req.body || {});
    await record('auto-rca', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/drift-score', async (req, res) => {
  try {
    const result = await ai.runFeature('drift-score', SCHEMAS['drift-score'], req.body || {});
    await record('drift-score', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/anomaly-classify', async (req, res) => {
  try {
    const result = await ai.runFeature('anomaly-classify', SCHEMAS['anomaly-classify'], req.body || {});
    await record('anomaly-classify', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/prompt-diff', async (req, res) => {
  try {
    const result = await ai.runFeature('prompt-diff', SCHEMAS['prompt-diff'], req.body || {});
    await record('prompt-diff', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/cost-anomaly', async (req, res) => {
  try {
    const result = await ai.runFeature('cost-anomaly', SCHEMAS['cost-anomaly'], req.body || {});
    await record('cost-anomaly', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/eval-generator', async (req, res) => {
  try {
    const result = await ai.runFeature('eval-generator', SCHEMAS['eval-generator'], req.body || {});
    await record('eval-generator', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/judge-calibrator', async (req, res) => {
  try {
    const result = await ai.runFeature('judge-calibrator', SCHEMAS['judge-calibrator'], req.body || {});
    await record('judge-calibrator', req.body || {}, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
