import React from 'react';
import CrudPage from '../components/CrudPage';
import { api_keysApi } from '../services/api';

const FIELDS = [
  { key: 'project_name', label: 'Project', type: 'text' },
  { key: 'key_prefix', label: 'Key Prefix', type: 'text' },
  { key: 'label', label: 'Label', type: 'text' },
  { key: 'last_used', label: 'Last Used', type: 'datetime-local' },
  { key: 'status', label: 'Status', type: 'select', options: ["active","revoked"] }
];

export default function ApiKeysPage() {
  return (
    <CrudPage
      title="API Keys"
      subtitle="Manage api keys records"
      api={api_keysApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
