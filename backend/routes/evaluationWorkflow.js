const router = require('express').Router();
const pool = require('../config/database');
const { requireCommander, requireTenant, requireWriter } = require('../middleware/auth');
const { datasetHash, evaluationMetrics, redact } = require('../services/telemetryPolicy');

router.use(requireTenant);

router.post('/runs', requireWriter, async (req, res) => {
  const cases = Array.isArray(req.body?.cases) ? req.body.cases : [];
  const threshold = Number(req.body?.threshold ?? 0.9);
  const baseline = Number(req.body?.baseline_pass_rate);
  if (!req.body?.dataset_name || !req.body?.dataset_version || !req.body?.project_name || !req.body?.candidate_version) {
    return res.status(422).json({ error: 'dataset_name, dataset_version, project_name and candidate_version are required' });
  }
  if (!cases.length || cases.length > 10000 || !cases.every((item) => typeof item.passed === 'boolean')) {
    return res.status(422).json({ error: 'cases must contain 1 to 10000 records with boolean passed' });
  }
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    return res.status(422).json({ error: 'threshold must be between 0 and 1' });
  }
  const safeCases = redact(cases.map((item) => ({
    case_ref: String(item.case_ref || ''), passed: item.passed,
    score: Number(item.score || 0), latency_ms: Number(item.latency_ms || 0), details: item.details || {},
  })));
  const metrics = evaluationMetrics(safeCases, threshold, Number.isFinite(baseline) ? baseline : null);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dataset = (await client.query(
      `INSERT INTO evaluation_datasets(tenant_id,name,version,content_hash,case_count,created_by)
       VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT(tenant_id,name,version) DO UPDATE SET content_hash=EXCLUDED.content_hash,case_count=EXCLUDED.case_count
       RETURNING *`,
      [req.tenantId, String(req.body.dataset_name), String(req.body.dataset_version), datasetHash(safeCases), safeCases.length, req.user.id]
    )).rows[0];
    const run = (await client.query(
      `INSERT INTO evaluation_runs(tenant_id,dataset_id,project_name,candidate_version,baseline_version,threshold,pass_rate,regression,gate_status,metrics,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.tenantId, dataset.id, String(req.body.project_name), String(req.body.candidate_version), req.body.baseline_version || null,
        threshold, metrics.pass_rate, metrics.regression, metrics.gate_status, metrics, req.user.id]
    )).rows[0];
    for (const item of safeCases) {
      await client.query(
        `INSERT INTO evaluation_cases(run_id,case_ref,passed,score,latency_ms,details) VALUES($1,$2,$3,$4,$5,$6)`,
        [run.id, item.case_ref, item.passed, item.score, item.latency_ms, item.details]
      );
    }
    let incident = null;
    if (metrics.gate_status === 'failed') {
      incident = (await client.query(
        `INSERT INTO incidents(tenant_id,project_name,source_type,source_id,severity,title,timeline)
         VALUES($1,$2,'evaluation_run',$3,'high',$4,$5) RETURNING *`,
        [req.tenantId, String(req.body.project_name), run.id, `Evaluation regression: ${req.body.candidate_version}`,
          [{ at: new Date().toISOString(), actor_id: req.user.id, event: 'gate_failed', metrics }]]
      )).rows[0];
      await client.query(
        `INSERT INTO alerts(tenant_id,project_name,severity,message,status,fired_at)
         VALUES($1,$2,'high',$3,'firing',NOW())`,
        [req.tenantId, String(req.body.project_name), `Evaluation gate failed for ${req.body.candidate_version}: pass rate ${metrics.pass_rate}`]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ run, metrics, incident });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Evaluation run failed:', error.message);
    res.status(500).json({ error: 'Evaluation run could not be recorded' });
  } finally { client.release(); }
});

router.get('/runs', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM evaluation_runs WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 100', [req.tenantId])).rows); }
  catch (error) { res.status(500).json({ error: 'Unable to list evaluation runs' }); }
});
router.get('/incidents', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM incidents WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 100', [req.tenantId])).rows); }
  catch (error) { res.status(500).json({ error: 'Unable to list incidents' }); }
});
router.post('/incidents/:id/status', requireCommander, async (req, res) => {
  const status = String(req.body?.status || '');
  if (!['open', 'investigating', 'mitigated', 'closed'].includes(status)) return res.status(422).json({ error: 'invalid incident status' });
  try {
    const event = { at: new Date().toISOString(), actor_id: req.user.id, event: 'status_changed', status, notes: String(req.body?.notes || '') };
    const result = await pool.query(
      `UPDATE incidents SET status=$1,timeline=timeline||$2::jsonb,updated_at=NOW() WHERE id=$3 AND tenant_id=$4 RETURNING *`,
      [status, JSON.stringify([event]), req.params.id, req.tenantId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Incident not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Unable to update incident' }); }
});

router.post('/retention/preview', requireCommander, async (req, res) => {
  const days = Math.max(1, Math.min(3650, Number(req.body?.days || 30)));
  try {
    const traces = await pool.query(`SELECT COUNT(*)::int AS count FROM traces WHERE tenant_id=$1 AND created_at<NOW()-($2||' days')::interval`, [req.tenantId, String(days)]);
    const spans = await pool.query(`SELECT COUNT(*)::int AS count FROM spans WHERE tenant_id=$1 AND created_at<NOW()-($2||' days')::interval`, [req.tenantId, String(days)]);
    res.json({ days, traces: traces.rows[0].count, spans: spans.rows[0].count, applied: false });
  } catch (error) { res.status(500).json({ error: 'Retention preview failed' }); }
});
router.post('/retention/apply', requireCommander, async (req, res) => {
  const days = Math.max(1, Math.min(3650, Number(req.body?.days || 30)));
  if (req.body?.confirm !== `DELETE_TRACES_OLDER_THAN_${days}_DAYS`) {
    return res.status(422).json({ error: 'Exact confirmation token required', confirmation: `DELETE_TRACES_OLDER_THAN_${days}_DAYS` });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const spans = await client.query(`DELETE FROM spans WHERE tenant_id=$1 AND created_at<NOW()-($2||' days')::interval`, [req.tenantId, String(days)]);
    const traces = await client.query(`DELETE FROM traces WHERE tenant_id=$1 AND created_at<NOW()-($2||' days')::interval`, [req.tenantId, String(days)]);
    await client.query('COMMIT');
    res.json({ applied: true, days, deleted_spans: spans.rowCount, deleted_traces: traces.rowCount });
  } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Retention application failed' }); }
  finally { client.release(); }
});

module.exports = router;
