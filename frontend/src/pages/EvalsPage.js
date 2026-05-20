import React from 'react';
import CrudPage from '../components/CrudPage';
import { evalsApi } from '../services/api';

const FIELDS = [
  { key: 'project_name', label: 'Project', type: 'text' },
  { key: 'name', label: 'Eval Name', type: 'text' },
  { key: 'eval_type', label: 'Type', type: 'select', options: ["regression","accuracy","toxicity","latency"] },
  { key: 'pass_rate', label: 'Pass Rate %', type: 'number' },
  { key: 'last_run', label: 'Last Run', type: 'datetime-local' }
];

export default function EvalsPage() {
  return (
    <CrudPage
      title="Evals"
      subtitle="Manage evals records"
      api={evalsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
