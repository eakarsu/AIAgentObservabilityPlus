import React from 'react';
import AIPage from '../components/AIPage';
import { aiEvalGenerator } from '../services/api';

export default function AIEvalGeneratorPage() {
  return (
    <AIPage
      title="AI · Eval Generator"
      feature="eval-generator"
      subtitle="Eval Generator"
      inputs={[
        { key: 'prompt_under_test', label: 'Prompt', type: 'textarea', placeholder: '' },
        { key: 'objective', label: 'Objective', type: 'text', placeholder: '' },
        { key: 'sample_count', label: 'Samples', type: 'number', placeholder: '' }
      ]}
      run={(v) => aiEvalGenerator(v)}
    />
  );
}
