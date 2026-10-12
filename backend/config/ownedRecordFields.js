module.exports = {
  projects: ['name','environment','status','notes'],
  traces: ['project_name','span_count','status','duration_ms','started_at'],
  prompts: ['project_name','name','version','model','perf_score'],
  evals: ['project_name','name','eval_type','pass_rate','last_run'],
  alerts: ['project_name','severity','message','status','fired_at'],
  'prompt-versions': ['prompt_name','version','content','perf_score','deployed'],
  'eval-results': ['eval_name','sample_count','pass_count','fail_count','run_at'],
  'api-keys': ['project_name','key_prefix','label','last_used','status'],
};
