import React from 'react';
import NativeAdvisoryForm from '../components/NativeAdvisoryForm';
import { aiObservabilityReadiness, getObservabilityReadinessHistory } from '../services/api';

const fields = [
  {
    "key": "workflowSummary",
    "label": "Workflow summary",
    "type": "textarea",
    "required": true,
    "maxLength": 1000
  }
];
const samples = [
  {
    "label": "Demo AI · Trace review",
    "values": {
      "workflowSummary": "Fictional planning draft: a team reviews de-identified agent traces before changing its support workflow. Suggest trace provenance controls, evaluation authorization, and a human incident-review checklist. No real telemetry or approval is asserted."
    }
  },
  {
    "label": "Demo AI · Evaluation handoff",
    "values": {
      "workflowSummary": "Fictional handoff draft: an analyst prepares an illustrative evaluation change for separate reviewer authorization. Describe source trace retention, permitted evaluation access, and a human review handoff. Do not claim an actual run or authorization."
    }
  },
  {
    "label": "Demo AI · Incident planning",
    "values": {
      "workflowSummary": "Fictional incident-planning example: an operations team wants a checklist for preserving trace provenance, limiting evaluation access, and escalating uncertain agent behavior to a human reviewer. No actual incident, telemetry or remediation success is supplied."
    }
  }
];

export default function ObservabilityReadinessPage() { return <NativeAdvisoryForm title="AI · Observability Readiness" description="Review a de-identified draft workflow using the supported native OpenRouter endpoint. Suggestions do not invent telemetry, authorize evaluations or replace human incident review." fields={fields} samples={samples} onRun={aiObservabilityReadiness} loadHistory={getObservabilityReadinessHistory} />; }
