import React from 'react';
import CrudPage from '../components/CrudPage';
import { tracesApi } from '../services/api';

const FIELDS = [
  { key: 'project_name', label: 'Project', type: 'text' },
  { key: 'span_count', label: 'Spans', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ["ok","error","degraded"] },
  { key: 'duration_ms', label: 'Duration (ms)', type: 'number' },
  { key: 'started_at', label: 'Started', type: 'datetime-local' }
];

export default function TracesPage() {
  return (
    <CrudPage
      title="Traces"
      subtitle="Manage traces records"
      api={tracesApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
