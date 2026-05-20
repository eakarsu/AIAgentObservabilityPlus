const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [projects_q, traces_q, prompts_q, evals_q, alerts_q, prompt_versions_q, eval_results_q, api_keys_q] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total FROM projects"),
      pool.query("SELECT COUNT(*) AS total FROM traces"),
      pool.query("SELECT COUNT(*) AS total FROM prompts"),
      pool.query("SELECT COUNT(*) AS total FROM evals"),
      pool.query("SELECT COUNT(*) AS total FROM alerts"),
      pool.query("SELECT COUNT(*) AS total FROM prompt_versions"),
      pool.query("SELECT COUNT(*) AS total FROM eval_results"),
      pool.query("SELECT COUNT(*) AS total FROM api_keys")
    ]);
    res.json({
      projects: projects_q.rows[0],
      traces: traces_q.rows[0],
      prompts: prompts_q.rows[0],
      evals: evals_q.rows[0],
      alerts: alerts_q.rows[0],
      prompt_versions: prompt_versions_q.rows[0],
      eval_results: eval_results_q.rows[0],
      api_keys: api_keys_q.rows[0]
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
