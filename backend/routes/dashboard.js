const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { tenantId } = require('../lib/security');
const tables = ['projects','traces','prompts','evals','alerts','prompt_versions','eval_results','api_keys'];
router.get('/', async (req,res) => {
  try {
    const tenant = tenantId(req.user), id = Number(req.user?.id);
    const actor = await pool.query('SELECT role FROM users WHERE id=$1 AND tenant_id=$2',[id,tenant]);
    if (!actor.rows[0] || actor.rows[0].role !== req.user.role) return res.status(403).json({error:'Your account access changed. Sign in again.'});
    const counts = await Promise.all(tables.map(async table => { const result=await pool.query(`SELECT COUNT(*) AS total,COUNT(*) FILTER(WHERE record_kind='planning_draft') AS planning_drafts FROM ${table} WHERE tenant_id=$1 AND created_by=$2`,[tenant,id]);return[table,result.rows[0]];}));
    res.json({...Object.fromEntries(counts),scope:'owned-record-counts'});
  } catch (_) { res.status(500).json({error:'Could not load owned PostgreSQL record counts.'}); }
});
module.exports=router;
