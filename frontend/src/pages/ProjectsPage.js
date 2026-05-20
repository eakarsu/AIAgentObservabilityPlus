import React from 'react';
import CrudPage from '../components/CrudPage';
import { projectsApi } from '../services/api';

const FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'environment', label: 'Env', type: 'select', options: ["prod","staging","dev"] },
  { key: 'status', label: 'Status', type: 'select', options: ["active","paused"] },
  { key: 'notes', label: 'Notes', type: 'textarea' }
];

export default function ProjectsPage() {
  return (
    <CrudPage
      title="Projects"
      subtitle="Manage projects records"
      api={projectsApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
