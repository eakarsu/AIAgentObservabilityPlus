import React from 'react';
import AIPage from '../components/AIPage';
import { aiPromptDiff } from '../services/api';

export default function AIPromptDiffPage() {
  return (
    <AIPage
      title="AI · Prompt Diff Analyzer"
      feature="prompt-diff"
      subtitle="Prompt Diff Analyzer"
      inputs={[
        { key: 'prompt_a', label: 'Prompt A', type: 'textarea', placeholder: '' },
        { key: 'prompt_b', label: 'Prompt B', type: 'textarea', placeholder: '' }
      ]}
      run={(v) => aiPromptDiff(v)}
    />
  );
}
