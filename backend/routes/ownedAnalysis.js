const express = require('express');
const pool = require('../config/database');
const ai = require('../services/ai');
const { tenantId } = require('../lib/security');
const { SCHEMAS, SAMPLES } = require('./analysisDefinitions');
const router = express.Router();

function actorFrom(req) {
  const id = Number(req.user?.id); let tenant; try { tenant = tenantId(req.user); } catch { throw Object.assign(new Error('An actual tenant-bound account is required.'), {status:403}); }
  if (!Number.isSafeInteger(id) || id < 1) throw Object.assign(new Error('An actual account is required.'), { status: 403 });
  return { id, tenant, role: req.user.role };
}
async function assertActor(db, actor, lock = false) {
  const result = await db.query('SELECT id,tenant_id,role FROM users WHERE id=$1 AND tenant_id=$2' + (lock ? ' FOR UPDATE' : ''), [actor.id, actor.tenant]);
  if (!result.rows[0] || result.rows[0].role !== actor.role) throw Object.assign(new Error('The account or its access has changed. Sign in again.'), { status: 403 });
}
const fail = (res, error) => res.status(error.status || 502).json({ error: error.status ? error.message : 'The analysis could not complete. Retry after checking the provider and database.' });

router.get('/samples', (req, res) => {
  const feature = String(req.query.feature || '');
  if (!feature) return res.json({ features: Object.keys(SAMPLES) });
  if (!SAMPLES[feature]) return res.status(404).json({ error: 'Unknown analysis feature.' });
  res.json({ feature, samples: SAMPLES[feature] });
});
router.get('/history', async (req, res) => {
  try {
    const actor = actorFrom(req); await assertActor(pool, actor);
    const feature = String(req.query.feature || ''), limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 200));
    if (feature && !SCHEMAS[feature]) return res.status(404).json({ error: 'Unknown analysis feature.' });
    const result = await pool.query('SELECT id,feature,input,output,created_at,provider_model FROM ai_results WHERE tenant_id=$1 AND user_id=$2 AND provider_request_id IS NOT NULL' + (feature ? ' AND feature=$3' : '') + ' ORDER BY created_at DESC,id DESC LIMIT $' + (feature ? '4' : '3'), feature ? [actor.tenant, actor.id, feature, Math.trunc(limit)] : [actor.tenant, actor.id, Math.trunc(limit)]);
    res.json(result.rows);
  } catch (error) { fail(res, error); }
});
router.get('/observability-readiness', async (req,res) => {
  try { const actor=actorFrom(req); await assertActor(pool,actor);
    const saved=await pool.query('SELECT id,input,output,created_at,provider_model FROM ai_results WHERE feature=$1 AND tenant_id=$2 AND user_id=$3 AND provider_request_id IS NOT NULL ORDER BY created_at DESC,id DESC LIMIT 100',['observability_readiness',actor.tenant,actor.id]);
    res.json({items:saved.rows,retained:true,canDelete:false});
  } catch(error) { fail(res,error); }
});
for (const feature of Object.keys(SCHEMAS)) router.post('/' + feature, async (req, res) => {
  const controller = new AbortController(), abort = () => { if (!res.writableEnded) controller.abort(); };
  req.once('aborted', abort); res.once('close', abort); if (req.aborted || res.destroyed) controller.abort();
  let client;
  try {
    const actor = actorFrom(req); await assertActor(pool, actor); controller.signal.throwIfAborted();
    const fields = Object.keys(SAMPLES[feature][0].values), input = {};
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw Object.assign(new Error('Analysis fields are required.'), { status: 400 });
    for (const key of fields) {
      const value = req.body[key];
      if (key === 'sample_count') {
        if (!Number.isInteger(value) || value < 1 || value > 100) throw Object.assign(new Error('Samples must be an integer from 1 to 100.'), { status: 400 });
      } else if (typeof value !== 'string' || !value.trim() || value.length > (feature==='observability-readiness'?1000:20000) || feature==='observability-readiness'&&value.trim().length<10) throw Object.assign(new Error(key.replace(/_/g, ' ') + ' is missing or outside its allowed length.'), { status: 400 });
      input[key] = value;
    }
    const evidence = await ai.callOpenRouterEvidence(
      'Prepare an advisory observability report from the supplied text only. Examples are fictional planning inputs, not verified telemetry or completed evaluations. Identify assumptions; do not approve changes, establish evidence or execute actions. Return a complete JSON object using this schema: ' + SCHEMAS[feature],
      'Feature: ' + feature + '\nInputs:\n' + JSON.stringify(input), { signal: controller.signal }
    );
    let output; try { output = JSON.parse(evidence.result); } catch { throw new Error('The provider did not return a complete structured report.'); }
    if (!output || Array.isArray(output) || typeof output !== 'object' || typeof output.summary !== 'string' || output.summary.trim().length < 10 || Object.keys(output).length < 2) throw new Error('The provider did not return a substantive analysis report.');
    controller.signal.throwIfAborted(); client = await pool.connect(); await client.query('BEGIN');
    await assertActor(client, actor, true); controller.signal.throwIfAborted();
    const saved = await client.query('INSERT INTO ai_results(feature,input,output,tenant_id,user_id,provider_request_id,provider_model,result_text) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,created_at', [feature==='observability-readiness'?'observability_readiness':feature, input, output, actor.tenant, actor.id, evidence.providerReceipt.requestId, evidence.providerReceipt.model, evidence.result]);
    controller.signal.throwIfAborted(); await client.query('COMMIT');
    if (!controller.signal.aborted && !res.destroyed) res.json({ analysisId: saved.rows[0].id, createdAt: saved.rows[0].created_at, result: output, providerReceipt: evidence.providerReceipt });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    if (!controller.signal.aborted && !res.destroyed) fail(res, error);
  } finally { client?.release(); req.off('aborted', abort); res.off('close', abort); }
});
module.exports = router;
