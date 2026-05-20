
import React, { useState, useEffect } from 'react';
const TOKEN_KEY = Object.keys(localStorage).find((k) => k.endsWith('_token')) || 'agent_obs_plus_token';
const API_BASE = 'http://localhost:4055/api';
const SAMPLE = JSON.stringify({resourceSpans:[{resource:{attributes:[{key:'service.name',value:{stringValue:'support-bot'}}]},scopeSpans:[{spans:[{traceId:'abc...',spanId:'001',name:'llm.call',startTimeUnixNano:'1700000000000000000',endTimeUnixNano:'1700000001500000000'},{traceId:'abc...',spanId:'002',name:'tool.search',parentSpanId:'001',startTimeUnixNano:'1700000000200000000',endTimeUnixNano:'1700000000900000000'}]}]}]}, null, 2);
export default function OtlpIngestWorkbench(){
  const [body,setBody]=useState(SAMPLE);const [resp,setResp]=useState(null);const [busy,setBusy]=useState(false);const [count,setCount]=useState(0);
  useEffect(()=>{ fetch(API_BASE+'/traces',{headers:{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}}).then(r=>r.json()).then(d=>setCount((d||[]).length)); },[busy]);
  const ingest=async()=>{
    setBusy(true);setResp(null);
    try{
      const r=await fetch(API_BASE+'/v1/traces',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)},body});
      const d=await r.json();setResp({status:r.status,body:d});
    }catch(e){setResp({status:0,body:{error:e.message}});}
    setBusy(false);
  };
  return (
    <div>
      <div className="page-header"><div><h2>OTLP Ingest</h2><p>POST a real OpenTelemetry-formatted span batch and persist it.</p></div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div className="card">
          <h3 style={{margin:'0 0 8px',color:'#cbd5e1'}}>OTLP payload</h3>
          <textarea value={body} onChange={e=>setBody(e.target.value)} style={{width:'100%',minHeight:300,fontFamily:'Menlo,monospace',fontSize:11,background:'#0b1424',color:'#cbd5e1',border:'1px solid #1e293b',borderRadius:6,padding:10}}/>
          <button className="btn" disabled={busy} onClick={ingest} style={{marginTop:10}}>{busy?'Ingesting…':'POST /api/v1/traces'}</button>
        </div>
        <div className="card">
          <h3 style={{margin:'0 0 8px',color:'#cbd5e1'}}>Result</h3>
          <div style={{fontSize:13,color:'#94a3b8',marginBottom:8}}>Total traces in DB: <strong style={{color:'#a78bfa'}}>{count}</strong></div>
          {resp&&<pre style={{background:'#0b1424',padding:10,borderRadius:6,fontSize:11,color:'#cbd5e1',overflow:'auto',maxHeight:300}}>HTTP {resp.status}\n{JSON.stringify(resp.body,null,2)}</pre>}
        </div>
      </div>
    </div>
  );
}