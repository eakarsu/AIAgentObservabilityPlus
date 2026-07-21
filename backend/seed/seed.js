const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

if (process.env.ENABLE_DEMO_SEED !== 'true') {
  throw new Error('Demo seed blocked. Run migrations separately and set ENABLE_DEMO_SEED=true explicitly.');
}

async function main() {
  console.log('[seed] inserting opt-in demo domain rows; migrations and users are managed separately');

  // projects
  for (const row of [{"name":"support-bot","environment":"prod","status":"active","notes":null},{"name":"classify-pipeline","environment":"staging","status":"active","notes":null},{"name":"rag-search","environment":"prod","status":"active","notes":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO projects (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // traces
  for (const row of [{"project_name":"support-bot","span_count":14,"status":"ok","duration_ms":2480,"started_at":null},{"project_name":"support-bot","span_count":18,"status":"error","duration_ms":8420,"started_at":null},{"project_name":"rag-search","span_count":7,"status":"ok","duration_ms":1240,"started_at":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO traces (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // prompts
  for (const row of [{"project_name":"support-bot","name":"reply","version":"v3","model":"sonnet-4.6","perf_score":87},{"project_name":"classify-pipeline","name":"classify","version":"v7","model":"haiku-4.5","perf_score":91},{"project_name":"rag-search","name":"retrieve","version":"v2","model":"haiku-4.5","perf_score":84}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO prompts (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // evals
  for (const row of [{"project_name":"support-bot","name":"reply-quality","eval_type":"accuracy","pass_rate":88,"last_run":null},{"project_name":"classify-pipeline","name":"class-accuracy","eval_type":"accuracy","pass_rate":94,"last_run":null},{"project_name":"rag-search","name":"latency-budget","eval_type":"latency","pass_rate":71,"last_run":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO evals (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // alerts
  for (const row of [{"project_name":"support-bot","severity":"high","message":"Reply p95 latency > 5s","status":"firing","fired_at":null},{"project_name":"classify-pipeline","severity":"medium","message":"Drift detected on class B","status":"firing","fired_at":null},{"project_name":"rag-search","severity":"critical","message":"Retrieve hit rate dropped 20%","status":"resolved","fired_at":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO alerts (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // prompt_versions
  for (const row of [{"prompt_name":"reply","version":"v3","content":"You are a helpful support agent.","perf_score":87,"deployed":"yes"},{"prompt_name":"reply","version":"v4-candidate","content":"You are a support agent. Be concise.","perf_score":84,"deployed":"canary"},{"prompt_name":"classify","version":"v7","content":"Classify email urgency.","perf_score":91,"deployed":"yes"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO prompt_versions (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // eval_results
  for (const row of [{"eval_name":"reply-quality","sample_count":200,"pass_count":176,"fail_count":24,"run_at":null},{"eval_name":"class-accuracy","sample_count":500,"pass_count":471,"fail_count":29,"run_at":null},{"eval_name":"latency-budget","sample_count":1000,"pass_count":712,"fail_count":288,"run_at":null}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO eval_results (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  // api_keys
  for (const row of [{"project_name":"support-bot","key_prefix":"aopl_a1b2","label":"prod ingester","last_used":null,"status":"active"},{"project_name":"classify-pipeline","key_prefix":"aopl_c3d4","label":"staging","last_used":null,"status":"active"},{"project_name":"rag-search","key_prefix":"aopl_e5f6","label":"old ci","last_used":null,"status":"revoked"}]) {
    try {
      const cols = Object.keys(row);
      const vals = cols.map((k) => row[k]);
      const ph = cols.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`INSERT INTO api_keys (${cols.join(',')}) VALUES (${ph})`, vals);
    } catch (e) { /* ignore unique conflicts */ }
  }

  console.log('[seed] domain rows seeded');
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
