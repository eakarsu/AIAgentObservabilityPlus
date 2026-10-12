import React, { useState } from 'react';
import ProjectsPage from './ProjectsPage';
import EvalsPage from './EvalsPage';
import AlertsPage from './AlertsPage';
const desks=[['projects','Project planning',ProjectsPage],['evals','Evaluation planning',EvalsPage],['alerts','Alert planning',AlertsPage]];
export default function CodexOperationsFeature() {
  const [active,setActive]=useState('projects'),Desk=desks.find(([key])=>key===active)[2];
  return <section><h1>Observability planning desk</h1><p>Plan source collection, evaluation work and alert rules using your saved PostgreSQL records. Drafts do not establish trace evidence, completed evaluations, incident resolution or approval.</p><div className="sr-actions" role="tablist" aria-label="Planning workspaces">{desks.map(([key,label])=><button key={key} type="button" role="tab" aria-selected={active===key} className="btn secondary" onClick={()=>setActive(key)}>{label}</button>)}</div><div role="tabpanel"><Desk key={active}/></div></section>;
}
