const express = require('express');
const pool = require('../config/database');
const { tenantId } = require('../lib/security');
const router = express.Router();
const entities=require('../config/ownedRecordFields');
function actor(req) {
  const id = Number(req.user?.id);
  if (!Number.isSafeInteger(id) || id < 1) throw Object.assign(new Error('An actual account is required.'), { status: 403 });
  return { id, tenant: tenantId(req.user), role: req.user.role };
}
async function authorize(db, identity, write = false, lock = false) {
  const rows = await db.query('SELECT id,role FROM users WHERE id=$1 AND tenant_id=$2' + (lock ? ' FOR UPDATE' : ''), [identity.id, identity.tenant]);
  if (!rows.rows[0] || rows.rows[0].role !== identity.role || write && !['commander','analyst'].includes(rows.rows[0].role)) throw Object.assign(new Error('Your current account does not permit this action. Sign in again.'), { status: 403 });
}
const validId = value => /^[1-9][0-9]*$/.test(String(value));
const fail = (res, error) => res.status(error.status || 500).json({ error: error.status ? error.message : 'The owned records service could not complete. Retry loading records.' });
async function transaction(identity, work, signal) {
  const db = await pool.connect();
  try { await db.query('BEGIN'); await authorize(db, identity, true, true); signal.throwIfAborted(); const value = await work(db); signal.throwIfAborted(); await db.query('COMMIT'); return value; }
  catch (error) { await db.query('ROLLBACK').catch(() => {}); throw error; }
  finally { db.release(); }
}
for (const [route, fields] of Object.entries(entities)) {
  const table = route.replace(/-/g,'_'), scope = 'tenant_id=$1 AND created_by=$2';
  router.get('/' + route, async (req, res) => {
    try { const identity = actor(req); await authorize(pool, identity); const result = await pool.query(`SELECT * FROM ${table} WHERE ${scope} ORDER BY id DESC`, [identity.tenant,identity.id]); res.json(result.rows); }
    catch (error) { fail(res,error); }
  });
  router.get('/' + route + '/:id', async (req, res) => {
    try { if (!validId(req.params.id)) return res.status(400).json({error:'Invalid record ID.'}); const identity = actor(req); await authorize(pool, identity); const result = await pool.query(`SELECT * FROM ${table} WHERE ${scope} AND id=$3`, [identity.tenant,identity.id,req.params.id]); if(!result.rows[0])return res.status(404).json({error:'Owned record not found.'}); res.json(result.rows[0]); }
    catch (error) { fail(res,error); }
  });
  for (const method of ['post','put','delete']) router[method]('/' + route + (method === 'post' ? '' : '/:id'), async (req,res) => {
    const controller = new AbortController(), abort = () => { if (!res.writableEnded) controller.abort(); };
    req.once('aborted',abort);res.once('close',abort);if(req.aborted||res.destroyed)controller.abort();
    try {
      if(method!=='post'&&!validId(req.params.id))return res.status(400).json({error:'Invalid record ID.'});
      const identity=actor(req);const body=req.body||{};
      if(method!=='delete')for(const field of fields)if(body[field]!==undefined&&body[field]!==null&&typeof body[field]!=='string'&&typeof body[field]!=='number')throw Object.assign(new Error('Record fields must contain text or numeric values.'),{status:400});
      const result=await transaction(identity,async db=>{
        if(method==='post')return db.query(`INSERT INTO ${table}(${fields.join(',')},tenant_id,created_by,record_kind) VALUES(${fields.map((_,i)=>'$'+(i+1)).join(',')},$${fields.length+1},$${fields.length+2},'planning_draft') RETURNING *`,[...fields.map(field=>body[field]===''?null:body[field]??null),identity.tenant,identity.id]);
        const owned=await db.query(`SELECT * FROM ${table} WHERE ${scope} AND id=$3 FOR UPDATE`,[identity.tenant,identity.id,req.params.id]);
        if(!owned.rows[0])throw Object.assign(new Error('Owned record not found.'),{status:404});
        if(owned.rows[0].record_kind!=='planning_draft')throw Object.assign(new Error('Retained source records cannot be edited or deleted through planning controls.'),{status:409});
        if(method==='delete')return db.query(`DELETE FROM ${table} WHERE ${scope} AND id=$3 RETURNING *`,[identity.tenant,identity.id,req.params.id]);
        const values=fields.map(field=>Object.hasOwn(body,field)?body[field]===''?null:body[field]:owned.rows[0][field]);
        return db.query(`UPDATE ${table} SET ${fields.map((field,i)=>field+'=$'+(i+1)).join(',')},updated_at=NOW() WHERE tenant_id=$${fields.length+1} AND created_by=$${fields.length+2} AND id=$${fields.length+3} RETURNING *`,[...values,identity.tenant,identity.id,req.params.id]);
      },controller.signal);
      if(!controller.signal.aborted&&!res.destroyed)res.status(method==='post'?201:200).json(method==='delete'?{deleted:true,id:result.rows[0].id}:result.rows[0]);
    }catch(error){if(!controller.signal.aborted&&!res.destroyed)fail(res,error);}
    finally{req.off('aborted',abort);res.off('close',abort);}
  });
}
module.exports=router;
