import React from 'react';
import CrudPage from '../components/CrudPage';
import { promptsApi } from '../services/api';

const FIELDS = [
  { key: 'project_name', label: 'Project', type: 'text' },
  { key: 'name', label: 'Prompt Name', type: 'text' },
  { key: 'version', label: 'Version', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'perf_score', label: 'Perf Score', type: 'number' }
];

export default function PromptsPage() {
  return (
    <CrudPage
      title="Prompts"
      subtitle="Manage prompts records"
      api={promptsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
