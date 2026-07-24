const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

router.post('/observability-readiness', async (req, res) => {
  const workflowSummary = typeof req.body?.workflowSummary === 'string' ? req.body.workflowSummary.trim() : '';
  if (workflowSummary.length < 10 || workflowSummary.length > 1000) {
    return res.status(400).json({ error: 'workflowSummary must contain 10-1000 characters' });
  }
  try {
    const evidence = await ai.callOpenRouterEvidence(
      'You review AI observability operations only. Return JSON with exactly three concise controls for trace provenance, evaluation authorization, and human incident review. Do not invent telemetry.',
      `Review this de-identified workflow: ${workflowSummary}`,
    );
    const saved = await pool.query(
      `INSERT INTO ai_results(feature,input,output,tenant_id,user_id,provider_request_id,provider_model,result_text)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,created_at`,
      [
        'observability_readiness',
        { workflowSummary },
        evidence,
        req.user.tenant_id,
        req.user.id,
        evidence.providerReceipt.requestId,
        evidence.providerReceipt.model,
        evidence.result,
      ],
    );
    return res.json({ analysisId: saved.rows[0].id, createdAt: saved.rows[0].created_at, ...evidence });
  } catch (error) {
    console.error('[ai] observability readiness failed:', error.message);
    return res.status(502).json({ error: 'AI provider request failed' });
  }
});

const SCHEMAS = {
  'regression-detect': `{"verdict":"regression"|"neutral"|"improvement","overall_score_delta":number,"per_sample":[{"input":string,"baseline_score":number,"candidate_score":number,"diff_summary":string}],"failure_modes":[{"mode":string,"count":number,"examples":[string]}],"recommendation":string,"summary":string}`,
  'auto-rca': `{"failure_summary":string,"hypotheses":[{"rank":number,"hypothesis":string,"evidence_span":string,"confidence":number,"fix_proposal":string}],"primary_root_cause":string,"blast_radius":"low"|"medium"|"high","summary":string}`,
  'drift-score': `{"drift_score":number,"verdict":"stable"|"drifting"|"alarming","dimensions":[{"dimension":string,"delta":number,"narrative":string}],"recommended_actions":[string],"summary":string}`,
  'anomaly-classify': `{"anomaly":boolean,"score":number,"type":"spike"|"dip"|"drift"|"oscillation","narrative":string,"recommended_action":string,"summary":string}`,
  'prompt-diff': `{"differences":[{"region":string,"change_type":"addition"|"removal"|"reword","semantic_impact":"low"|"medium"|"high","notes":string}],"likely_behavioral_change":string,"risk":"low"|"medium"|"high","summary":string}`,
  'cost-anomaly': `{"anomaly_detected":boolean,"day_over_day_pct":number,"likely_driver":string,"recommended_action":string,"projected_monthly_extra_usd":number,"summary":string}`,
  'eval-generator': `{"eval_name":string,"samples":[{"input":string,"expected_property":string,"scoring_method":string}],"judge_prompt":string,"summary":string}`,
  'judge-calibrator': `{"agreement_pct":number,"systematic_biases":[string],"recalibration_suggestion":string,"recommended_judge":string,"summary":string}`
};

const SAMPLES = {
  'regression-detect': [
    { label: 'Shorter reply prompt', values: {"baseline_prompt":"You are a helpful support agent. Answer concisely.","candidate_prompt":"You are a support agent. Answer in one sentence.","sample_inputs":"Refund a $50 order\nWhere is my package?\nUpgrade my plan"} },
    { label: 'Add tone guidance', values: {"baseline_prompt":"Classify email urgency.","candidate_prompt":"Classify email urgency. Be conservative on \"urgent\".","sample_inputs":"Where is my order? Pls reply asap.\nFollow-up on quote"} },
    { label: 'Model swap test', values: {"baseline_prompt":"Summarize the article.","candidate_prompt":"Summarize the article in 3 bullets.","sample_inputs":"Long news article 1\nLong news article 2"} }
  ],
  'auto-rca': [
    { label: 'Tool call timeout', values: {"trace_json":"span 1: llm.call 800ms ok; span 2: tool.search 30000ms TIMEOUT; span 3: llm.call retry 800ms ok; final: empty reply","user_intent":"Answer customer about order status"} },
    { label: 'Hallucinated number', values: {"trace_json":"span 1: rag.retrieve 3 docs; span 2: llm.compose says \"the refund is $99\" but no source mentions $99","user_intent":"Quote refund amount"} },
    { label: 'Wrong tool', values: {"trace_json":"span 1: classify intent=refund; span 2: invoked tool=cancel_order instead of issue_refund","user_intent":"Issue refund"} }
  ],
  'drift-score': [
    { label: 'Reply length increased', values: {"baseline_outputs":"avg 90 words per reply; sentiment 0.78","current_outputs":"avg 240 words per reply; sentiment 0.62"} },
    { label: 'Classifier shifted', values: {"baseline_outputs":"80% precision on class A","current_outputs":"62% precision on class A; class B dominating"} },
    { label: 'Latency drift', values: {"baseline_outputs":"p95 latency 1.4s","current_outputs":"p95 latency 4.1s with new model"} }
  ],
  'anomaly-classify': [
    { label: 'Spike in errors', values: {"metric_name":"error_rate_pct","recent_series":"0.4,0.5,0.3,0.6,12.4,11.8,9.2"} },
    { label: 'Slow latency drift', values: {"metric_name":"p95_latency_ms","recent_series":"1100,1120,1180,1240,1320,1410,1520"} },
    { label: 'Stable metric', values: {"metric_name":"cache_hit_rate","recent_series":"88,89,87,88,88,89,88"} }
  ],
  'prompt-diff': [
    { label: 'Tightened tone', values: {"prompt_a":"Be helpful and friendly.","prompt_b":"Be concise and professional. Never use exclamation marks."} },
    { label: 'Added safety', values: {"prompt_a":"Answer the user.","prompt_b":"Answer the user. Refuse requests for medical or legal advice."} },
    { label: 'Format change', values: {"prompt_a":"Reply in markdown.","prompt_b":"Reply in plain text, max 3 sentences."} }
  ],
  'cost-anomaly': [
    { label: '3x cost spike', values: {"cost_series":"18,21,19,22,71,68,72","token_series":"400k,420k,410k,430k,1.4M,1.3M,1.4M"} },
    { label: 'Cost up tokens flat', values: {"cost_series":"18,21,19,22,38,42,40","token_series":"400k,420k,410k,430k,420k,440k,430k"} },
    { label: 'Stable', values: {"cost_series":"18,21,19,22,20,21,19","token_series":"400k,420k,410k,430k,420k,440k,430k"} }
  ],
  'eval-generator': [
    { label: 'Reply quality', values: {"prompt_under_test":"You are a support agent.","objective":"Reply quality","sample_count":25} },
    { label: 'Urgency', values: {"prompt_under_test":"Classify urgency.","objective":"Class precision","sample_count":50} },
    { label: 'Refusal', values: {"prompt_under_test":"Answer the user.","objective":"Refuse medical advice","sample_count":20} }
  ],
  'judge-calibrator': [
    { label: 'Reply judge', values: {"judge_prompt":"Rate 1-5.","gold_labels":"sample1=4"} },
    { label: 'Classifier', values: {"judge_prompt":"Correct?","gold_labels":"s1=correct"} },
    { label: 'Toxicity', values: {"judge_prompt":"Toxic?","gold_labels":"s1=no"} }
  ]
};

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
