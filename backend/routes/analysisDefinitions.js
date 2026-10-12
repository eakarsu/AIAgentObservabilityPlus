const SCHEMAS = {
  'blast-radius': `{"summary":string,"review_priorities":[{"area":string,"proposed_review":string}],"assumptions":[string],"missing_evidence":[string],"human_review_questions":[string]}`,
  'observability-readiness': `{"summary":string,"controls":[{"area":"trace provenance"|"evaluation authorization"|"human incident review","recommendation":string}],"assumptions":[string]}`,
  'regression-detect': `{"verdict":"regression"|"neutral"|"improvement","overall_score_delta":number,"per_sample":[{"input":string,"baseline_score":number,"candidate_score":number,"diff_summary":string}],"failure_modes":[{"mode":string,"count":number,"examples":[string]}],"recommendation":string,"summary":string}`,
  'auto-rca': `{"failure_summary":string,"hypotheses":[{"rank":number,"hypothesis":string,"evidence_span":string,"confidence":number,"fix_proposal":string}],"primary_root_cause":string,"blast_radius":"low"|"medium"|"high","summary":string}`,
  'drift-score': `{"drift_score":number,"verdict":"stable"|"drifting"|"alarming","dimensions":[{"dimension":string,"delta":number,"narrative":string}],"recommended_actions":[string],"summary":string}`,
  'anomaly-classify': `{"anomaly":boolean,"score":number,"type":"spike"|"dip"|"drift"|"oscillation","narrative":string,"recommended_action":string,"summary":string}`,
  'prompt-diff': `{"differences":[{"region":string,"change_type":"addition"|"removal"|"reword","semantic_impact":"low"|"medium"|"high","notes":string}],"likely_behavioral_change":string,"risk":"low"|"medium"|"high","summary":string}`,
  'cost-anomaly': `{"anomaly_detected":boolean,"day_over_day_pct":number,"likely_driver":string,"recommended_action":string,"projected_monthly_extra_usd":number,"summary":string}`,
  'eval-generator': `{"eval_name":string,"samples":[{"input":string,"expected_property":string,"scoring_method":string}],"judge_prompt":string,"summary":string}`,
  'judge-calibrator': `{"agreement_pct":number,"systematic_biases":[string],"recalibration_suggestion":string,"recommended_judge":string,"summary":string}`
};

const SAMPLES = {
  'blast-radius':[
    {label:'Focused review',values:{scenarioBrief:'Fictional planning scenario: an agent support workflow may retry a tool unexpectedly. No actual trace identifier, affected user count or remediation success is supplied.',reviewGoal:'Prepare a short advisory review of possible dependencies and evidence needed before deciding on containment.',constraints:'Preserve source records, permissions and human review. Do not disable prompts, replay actions, invent impact counts or assert an actual incident.'}},
    {label:'Planning comparison',values:{scenarioBrief:'Fictional planning comparison: a team is considering a prompt change that could affect related tools. Real telemetry and affected-user measurements have not been supplied.',reviewGoal:'Compare possible review approaches, dependency questions and reversible planning options.',constraints:'Separate assumptions from supplied observations. Actual changes require independent authorization and genuine sources; this report executes nothing.'}},
    {label:'Detailed review',values:{scenarioBrief:'Fictional detailed review exercise: reviewers want to preserve trace provenance and understand uncertain downstream effects before authorizing a workflow change. No observed incident is asserted.',reviewGoal:'Prepare evidence collection priorities, dependency review questions and a human handoff checklist.',constraints:'No invented trace IDs, user counts, severity scores, permissions or completed remediation. Retain all source and execution gates.'}},
  ],
  'observability-readiness': [
    {label:'Demo AI · Trace review',values:{workflowSummary:'Fictional planning draft: review de-identified agent traces before changing a support workflow. Suggest provenance controls and human incident review. No real telemetry or approval is asserted.'}},
    {label:'Demo AI · Evaluation handoff',values:{workflowSummary:'Fictional handoff draft: prepare an illustrative evaluation change for separate reviewer authorization. Describe source retention, evaluation access and human review. No actual run or authorization is asserted.'}},
    {label:'Demo AI · Incident planning',values:{workflowSummary:'Fictional incident planning: preserve trace provenance, limit evaluation access and escalate uncertain agent behavior to a human reviewer. No incident, telemetry or remediation success is supplied.'}},
  ],
  'regression-detect': [
    { label: 'Shorter reply prompt', values: {"baseline_prompt":"You are a helpful support agent. Answer concisely.","candidate_prompt":"You are a support agent. Answer in one sentence.","sample_inputs":"Refund a $50 order\nWhere is my package?\nUpgrade my plan"} },
    { label: 'Add tone guidance', values: {"baseline_prompt":"Classify email urgency.","candidate_prompt":"Classify email urgency. Be conservative on \"urgent\".","sample_inputs":"Where is my order? Pls reply asap.\nFollow-up on quote"} },
    { label: 'Model swap test', values: {"baseline_prompt":"Summarize the article.","candidate_prompt":"Summarize the article in 3 bullets.","sample_inputs":"Long news article 1\nLong news article 2"} }
  ],
  'auto-rca': [
    { label: 'Tool call timeout', values: {"trace_json":"span 1: llm.call 800ms ok; span 2: tool.search 30000ms TIMEOUT; span 3: llm.call retry 800ms ok; final: empty reply","user_intent":"Answer customer about order status"} },
    { label: 'Hallucinated number', values: {"trace_json":"span 1: rag.retrieve 3 docs; span 2: llm.compose says \"the refund is $99\" but no source mentions $99","user_intent":"Quote refund amount"} },
    { label: 'Wrong tool', values: {"trace_json":"span 1: classify intent=refund; span 2: invoked tool=cancel_order instead of issue_refund","user_intent":"Issue refund"} }
  ],
  'drift-score': [
    { label: 'Reply length increased', values: {"baseline_outputs":"avg 90 words per reply; sentiment 0.78","current_outputs":"avg 240 words per reply; sentiment 0.62"} },
    { label: 'Classifier shifted', values: {"baseline_outputs":"80% precision on class A","current_outputs":"62% precision on class A; class B dominating"} },
    { label: 'Latency drift', values: {"baseline_outputs":"p95 latency 1.4s","current_outputs":"p95 latency 4.1s with new model"} }
  ],
  'anomaly-classify': [
    { label: 'Spike in errors', values: {"metric_name":"error_rate_pct","recent_series":"0.4,0.5,0.3,0.6,12.4,11.8,9.2"} },
    { label: 'Slow latency drift', values: {"metric_name":"p95_latency_ms","recent_series":"1100,1120,1180,1240,1320,1410,1520"} },
    { label: 'Stable metric', values: {"metric_name":"cache_hit_rate","recent_series":"88,89,87,88,88,89,88"} }
  ],
  'prompt-diff': [
    { label: 'Tightened tone', values: {"prompt_a":"Be helpful and friendly.","prompt_b":"Be concise and professional. Never use exclamation marks."} },
    { label: 'Added safety', values: {"prompt_a":"Answer the user.","prompt_b":"Answer the user. Refuse requests for medical or legal advice."} },
    { label: 'Format change', values: {"prompt_a":"Reply in markdown.","prompt_b":"Reply in plain text, max 3 sentences."} }
  ],
  'cost-anomaly': [
    { label: '3x cost spike', values: {"cost_series":"18,21,19,22,71,68,72","token_series":"400k,420k,410k,430k,1.4M,1.3M,1.4M"} },
    { label: 'Cost up tokens flat', values: {"cost_series":"18,21,19,22,38,42,40","token_series":"400k,420k,410k,430k,420k,440k,430k"} },
    { label: 'Stable', values: {"cost_series":"18,21,19,22,20,21,19","token_series":"400k,420k,410k,430k,420k,440k,430k"} }
  ],
  'eval-generator': [
    { label: 'Reply quality', values: {"prompt_under_test":"You are a support agent.","objective":"Reply quality","sample_count":25} },
    { label: 'Urgency', values: {"prompt_under_test":"Classify urgency.","objective":"Class precision","sample_count":50} },
    { label: 'Refusal', values: {"prompt_under_test":"Answer the user.","objective":"Refuse medical advice","sample_count":20} }
  ],
  'judge-calibrator': [
    { label: 'Reply judge', values: {"judge_prompt":"Rate 1-5.","gold_labels":"sample1=4"} },
    { label: 'Classifier', values: {"judge_prompt":"Correct?","gold_labels":"s1=correct"} },
    { label: 'Toxicity', values: {"judge_prompt":"Toxic?","gold_labels":"s1=no"} }
  ]
};

module.exports = { SCHEMAS, SAMPLES };
