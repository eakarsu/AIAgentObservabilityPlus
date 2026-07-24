
import React, { useEffect, useState } from 'react';
const TOKEN_KEY = Object.keys(localStorage).find((k) => k.endsWith('_token')) || 'agent_obs_plus_token';
const API_BASE = '/api';
export default function TraceViewerWorkbench(){
  const [rows,setRows]=useState([]);const [open,setOpen]=useState(null);const [spans,setSpans]=useState([]);const [loading,setLoading]=useState(false);
  useEffect(()=>{fetch(API_BASE+'/traces',{headers:{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}}).then(r=>r.json()).then(setRows);},[]);
  const drill=async(id)=>{setOpen(id);setLoading(true);
    const r=await fetch(API_BASE+'/traces/'+id+'/spans',{headers:{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}});
    const d=await r.json();setSpans(Array.isArray(d)?d:[]);setLoading(false);};
  return (
    <div>
      <div className="page-header"><div><h2>Trace Viewer</h2><p>Click a trace to see its real span hierarchy.</p></div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16}}>
        <div className="card">
          <h3 style={{margin:'0 0 12px',color:'#cbd5e1'}}>Traces</h3>
          {rows.map(r=>{
            const tone=r.status==='error'?'#ef4444':r.status==='degraded'?'#f59e0b':'#10b981';
            return (
              <div key={r.id} onClick={()=>drill(r.id)} style={{padding:'10px',cursor:'pointer',background:open===r.id?'#1e293b':'transparent',borderRadius:6,marginBottom:4}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span>{r.project_name}</span><span style={{color:tone,fontSize:12}}>{r.status}</span>
                </div>
                <div style={{color:'#94a3b8',fontSize:11}}>{r.span_count} spans · {r.duration_ms}ms</div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <h3 style={{margin:'0 0 12px',color:'#cbd5e1'}}>Spans</h3>
          {!open&&<div className="empty-state">Pick a trace ←</div>}
          {loading&&<div className="empty-state">Loading…</div>}
          {!loading&&spans.map(s=>{
            const w=Math.max(2,Math.min(100,Number(s.duration_ms||0)/Math.max(1,...spans.map(x=>Number(x.duration_ms||0)))*100));
            const tone=s.status==='error'?'#ef4444':'#3b82f6';
            return (
              <div key={s.id} style={{padding:'6px 0',borderBottom:'1px solid #1e293b'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                  <span style={{paddingLeft:Number(s.depth||0)*14}}>{s.span_name}</span>
                  <span style={{color:'#94a3b8'}}>{s.duration_ms}ms</span>
                </div>
                <div style={{height:6,background:'#1e293b',borderRadius:3}}><div style={{height:'100%',width:w+'%',background:tone,opacity:.7,borderRadius:3}}/></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
