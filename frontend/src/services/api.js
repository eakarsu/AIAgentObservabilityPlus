const API_BASE = '/api';
const TOKEN_KEY = 'agent_obs_plus_token';
const USER_KEY = 'agent_obs_plus_user';

export { API_BASE };
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };
export const getStoredUser = () => { try { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
export const setStoredUser = (u) => { try { u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY); } catch {} };
export function logout() { setToken(null); setStoredUser(null); if (typeof window !== 'undefined') window.location.assign('/login'); }
export function getRole() { return (getStoredUser()?.role || 'viewer').toLowerCase(); }
export function canWrite() { return ['commander', 'analyst'].includes(getRole()); }
export function isCommander() { return getRole() === 'commander'; }

async function request(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (res.status === 401 && !url.startsWith('/auth/login')) { logout(); throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function crud(base) {
  return {
    list: (options = {}) => request(`/${base}`, options),
    get: (id) => request(`/${base}/${id}`),
    create: (data, options = {}) => request(`/${base}`, { ...options, method: 'POST', body: JSON.stringify(data) }),
    update: (id, d, options = {}) => request(`/${base}/${id}`, { ...options, method: 'PUT', body: JSON.stringify(d) }),
    remove: (id, options = {}) => request(`/${base}/${id}`, { ...options, method: 'DELETE' }),
    bulkImport: (csv,options={}) => request(`/${base}/bulk-import`, { ...options,method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: csv }),
    listAttachments: (id,options={}) => request(`/${base}/${id}/attachments`,options),
    uploadAttachment: async (id, file,options={}) => {
      const token = getToken();
      const form = new FormData(); form.append('file', file);
      const res = await fetch(`${API_BASE}/${base}/${id}/attachments`, {
        ...options,method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      return data;
    },
  };
}

export const login = (email, password, options = {}) => request('/auth/login', { ...options, method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => request('/auth/me');

export const projectsApi = crud('projects');
export const tracesApi = crud('traces');
export const promptsApi = crud('prompts');
export const evalsApi = crud('evals');
export const alertsApi = crud('alerts');
export const prompt_versionsApi = crud('prompt-versions');
export const eval_resultsApi = crud('eval-results');
export const api_keysApi = crud('api-keys');

export const aiRegressionDetect = (body, options = {}) => request('/ai/regression-detect', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiAutoRca = (body, options = {}) => request('/ai/auto-rca', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiDriftScore = (body, options = {}) => request('/ai/drift-score', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiAnomalyClassify = (body, options = {}) => request('/ai/anomaly-classify', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiPromptDiff = (body, options = {}) => request('/ai/prompt-diff', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiCostAnomaly = (body, options = {}) => request('/ai/cost-anomaly', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiEvalGenerator = (body, options = {}) => request('/ai/eval-generator', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiJudgeCalibrator = (body, options = {}) => request('/ai/judge-calibrator', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const blastRadiusAnalyze = (body) => request('/blast-radius/analyze', { method: 'POST', body: JSON.stringify(body || {}) });

export const getAIHistory = (feature, limit = 25, options = {}) => {
  const qs = new URLSearchParams({ ...(feature ? { feature } : {}), limit: String(limit) }).toString();
  return request(`/ai/history?${qs}`, options);
};
export const getAISamples = (feature) => {
  const qs = new URLSearchParams({ feature: feature || '' }).toString();
  return request(`/ai/samples?${qs}`);
};

export const getDashboardStats = (options = {}) => request('/dashboard', options);

export const getNotifications = (options = {}) => request('/notifications', options);
export const getUnreadNotifications = (options = {}) => request('/notifications/unread', options);
export const markNotificationRead = (id,options={}) => request(`/notifications/${id}/read`, { ...options,method: 'POST' });
export const markAllNotificationsRead = (options={}) => request('/notifications/mark-all-read', { ...options,method: 'POST' });

export const webhooksApi = {
  list: () => request('/webhooks'),
  create: (d) => request('/webhooks', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id) => request(`/webhooks/${id}`, { method: 'DELETE' }),
  test: (event, payload) => request('/webhooks/test', { method: 'POST', body: JSON.stringify({ event, payload }) }),
  deliveries: (id) => request(`/webhooks/${id}/deliveries`),
};

export const aiObservabilityReadiness = (body, options = {}) => request("/ai/observability-readiness", { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const getObservabilityReadinessHistory = (options = {}) => request("/ai/observability-readiness", options);

export const archiveAttachment=(id,options={})=>request('/attachments/'+id,{...options,method:'DELETE'});
export async function downloadAttachment(item,options={}){const response=await fetch(API_BASE+'/attachments/'+item.id+'/download',{...options,headers:{Authorization:'Bearer '+getToken()}});if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.error||'Could not download the owned source file.');}const blob=await response.blob();if(options.signal?.aborted)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=item.original_name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export const aiBlastRadiusReview=(body,options={})=>request('/ai/blast-radius',{...options,method:'POST',body:JSON.stringify(body)});

export const importEvaluationSource=(body,options={})=>request('/evaluations/runs',{...options,method:'POST',body:JSON.stringify(body)});
export const getEvaluationSource=(id,options={})=>request('/evaluations/runs/'+id,options);
export const previewOwnedRetention=(days,options={})=>request('/evaluations/retention/preview',{...options,method:'POST',body:JSON.stringify({days})});
