import { useCallback, useEffect, useRef, useState } from 'react';
import { getDashboardStats } from '../services/api';
export const recordDomains = [
  ['projects','Projects','/projects'], ['traces','Trace plans','/traces'], ['prompts','Prompts','/prompts'], ['evals','Evaluation plans','/evals'],
  ['alerts','Alert plans','/alerts'], ['prompt_versions','Prompt versions','/prompt-versions'], ['eval_results','Evaluation templates','/eval-results'], ['api_keys','Credential plans','/api-keys'],
];
export default function useOwnedStats() {
  const [stats,setStats]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),pending=useRef(null);
  const reload=useCallback(async()=>{pending.current?.abort();const controller=new AbortController();pending.current=controller;setLoading(true);setError('');try{const data=await getDashboardStats({signal:controller.signal});for(const[key]of recordDomains){if(!data?.[key]||!/^\d+$/.test(String(data[key].total))||!/^\d+$/.test(String(data[key].planning_drafts)))throw new Error('The owned record counts returned an invalid response.');}if(pending.current===controller&&!controller.signal.aborted)setStats(data);}catch(failure){if(pending.current===controller&&!controller.signal.aborted)setError(failure.message);}finally{if(pending.current===controller&&!controller.signal.aborted){pending.current=null;setLoading(false);}}},[]);
  useEffect(()=>{reload();return()=>{pending.current?.abort();pending.current=null;}},[reload]);return{stats,error,loading,reload};
}
