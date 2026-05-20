import React from 'react';
import CrudPage from '../components/CrudPage';
import { alertsApi } from '../services/api';

const FIELDS = [
  { key: 'project_name', label: 'Project', type: 'text' },
  { key: 'severity', label: 'Severity', type: 'select', options: ["low","medium","high","critical"] },
  { key: 'message', label: 'Message', type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ["firing","resolved","silenced"] },
  { key: 'fired_at', label: 'Fired', type: 'datetime-local' }
];

export default function AlertsPage() {
  return (
    <CrudPage
      title="Alerts"
      subtitle="Manage alerts records"
      api={alertsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
