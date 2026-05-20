import React from 'react';
import CrudPage from '../components/CrudPage';
import { prompt_versionsApi } from '../services/api';

const FIELDS = [
  { key: 'prompt_name', label: 'Prompt', type: 'text' },
  { key: 'version', label: 'Version', type: 'text' },
  { key: 'content', label: 'Content', type: 'textarea' },
  { key: 'perf_score', label: 'Perf Score', type: 'number' },
  { key: 'deployed', label: 'Deployed', type: 'select', options: ["yes","no","canary"] }
];

export default function PromptVersionsPage() {
  return (
    <CrudPage
      title="Prompt Versions"
      subtitle="Manage prompt versions records"
      api={prompt_versionsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
