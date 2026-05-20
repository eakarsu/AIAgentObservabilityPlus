import React from 'react';
import AIPage from '../components/AIPage';
import { aiJudgeCalibrator } from '../services/api';

export default function AIJudgeCalibratorPage() {
  return (
    <AIPage
      title="AI · Judge Calibrator"
      feature="judge-calibrator"
      subtitle="Judge Calibrator"
      inputs={[
        { key: 'judge_prompt', label: 'Judge Prompt', type: 'textarea', placeholder: '' },
        { key: 'gold_labels', label: 'Gold Labels', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiJudgeCalibrator(v)}
    />
  );
}
