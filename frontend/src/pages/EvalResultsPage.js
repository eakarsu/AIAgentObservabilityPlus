import React from 'react';
import CrudPage from '../components/CrudPage';
import { eval_resultsApi } from '../services/api';

const FIELDS = [
  { key: 'eval_name', label: 'Eval', type: 'text' },
  { key: 'sample_count', label: 'Samples', type: 'number' },
  { key: 'pass_count', label: 'Pass', type: 'number' },
  { key: 'fail_count', label: 'Fail', type: 'number' },
  { key: 'run_at', label: 'Run At', type: 'datetime-local' }
];

export default function EvalResultsPage() {
  return (
    <CrudPage
      title="Eval Results"
      subtitle="Manage eval results records"
      api={eval_resultsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
