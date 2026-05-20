// routes/obsExtras.js — span hierarchy + OTLP ingest
const express=require('express');
const pool=require('../config/database');
const router=express.Router();

// Mock span hierarchy for a given trace_id — derives spans deterministically from trace row
router.get('/traces/:id/spans', async (req,res)=>{
  try {
    const t=await pool.query('SELECT * FROM traces WHERE id=$1',[req.params.id]);
    if(!t.rows.length) return res.status(404).json({error:'not found'});
    const tr=t.rows[0];
    const total=Number(tr.duration_ms||1000);
    const spanNames=['llm.request','tool.search','db.query','llm.compose','tool.respond'];
    const out=[];
    let cursor=0;
    for(let i=0;i<Math.min(Number(tr.span_count||3),spanNames.length);i++){
      const dur=Math.max(20,Math.floor(total*(0.1+(i%3)*0.18)));
      out.push({id:tr.id*100+i,trace_id:tr.id,span_name:spanNames[i],parent_span_id:i===0?null:tr.id*100,depth:i===0?0:1,duration_ms:dur,status:i===2&&tr.status==='error'?'error':'ok',started_at:new Date(Date.now()-(total-cursor)).toISOString()});
      cursor+=dur;
    }
    res.json(out);
  } catch(e){ res.status(500).json({error:e.message}); }
});

// OTLP ingest endpoint — accepts OTLP-formatted JSON and creates a trace row
router.post('/v1/traces', async (req,res)=>{
  try {
    const b=req.body||{};
    const rss=Array.isArray(b.resourceSpans)?b.resourceSpans:[];
    let totalSpans=0;let svc='unknown';let durMs=0;
    for(const rs of rss){
      const attrs=(rs.resource&&rs.resource.attributes)||[];
      for(const a of attrs){
        if(a.key==='service.name'&&a.value){
          svc=a.value.stringValue||a.value.string_value||svc;
        }
      }
      for(const ss of (rs.scopeSpans||[])){
        for(const sp of (ss.spans||[])){
          totalSpans++;
          const s=Number(sp.startTimeUnixNano||0);
          const e=Number(sp.endTimeUnixNano||0);
          if(e>s) durMs=Math.max(durMs, Math.floor((e-s)/1e6));
        }
      }
    }
    const r=await pool.query("INSERT INTO traces (project_name,span_count,status,duration_ms,started_at) VALUES ($1,$2,'ok',$3,NOW()) RETURNING *",[svc,totalSpans,durMs]);
    res.json({ingested:true,trace:r.rows[0],spans_received:totalSpans});
  } catch(e){ res.status(500).json({error:e.message}); }
});

module.exports=router;