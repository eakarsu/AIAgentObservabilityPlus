import React, { useEffect, useRef, useState } from 'react';
import AIFieldPresets, { completeExample } from './AIFieldPresets';
import AIResultView from './AIResultView';
import useCancelableAI from './useCancelableAI';

export default function NativeAdvisoryForm({ title, description, fields, samples, onRun, loadHistory }) {
  const [values, setValues] = useState({});
  const [items, setItems] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(Boolean(loadHistory));
  const [historyRevision, setHistoryRevision] = useState(0);
  const [selected, setSelected] = useState(null);
  const pending = useRef(null), dialog = useRef(null), priorFocus = useRef(null);
  const request = useCancelableAI();
  useEffect(() => {
    if (!loadHistory) return undefined;
    const controller = new AbortController(); setHistoryLoading(true); setHistoryError('');
    loadHistory({ signal: controller.signal }).then(data => {
      if (!data || !Array.isArray(data.items)) throw new Error('The native report history returned an unexpected response.');
      if (!controller.signal.aborted) setItems(data.items);
    }).catch(error => { if (!controller.signal.aborted) setHistoryError(error.message || 'Could not load saved reports.'); }).finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [loadHistory, historyRevision]);
  useEffect(() => {
    if (!selected) return undefined;
    priorFocus.current = document.activeElement; dialog.current?.focus();
    const keydown = event => { if (event.key === 'Escape') { event.preventDefault(); setSelected(null); } if (event.key === 'Tab') { const nodes = [...dialog.current.querySelectorAll('button,a,input,select,textarea,[tabindex]')].filter(node => !node.disabled && node.tabIndex >= 0); const first = nodes[0], last = nodes.at(-1); if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } } };
    document.addEventListener('keydown', keydown); return () => { document.removeEventListener('keydown', keydown); priorFocus.current?.focus?.(); };
  }, [selected]);
  const cancel = () => { pending.current = null; request.cancel(); };
  const submit = async event => {
    event.preventDefault(); if (pending.current) return;
    const owner = {}; pending.current = owner;
    await request.run(async options => {
      const body = Object.fromEntries(fields.map(field => [field.key, field.type === 'number' ? Number(values[field.key] || 0) : field.type === 'json' && values[field.key] ? JSON.parse(values[field.key]) : values[field.key] ?? '']));
      for (const field of fields) if (field.required && !String(body[field.key] ?? '').trim()) throw new Error(`${field.label} is required.`);
      const response = await onRun(body, options);
      if (!response || response.error || response.result === undefined && response.analysisId === undefined) throw new Error(response?.error || 'The native AI endpoint returned an unexpected response.');
      return response;
    });
    if (pending.current === owner) { pending.current = null; setHistoryRevision(value => value + 1); }
  };
  const report = request.result;
  return <div className="ai-page">
    <div className="page-header"><div><h1>{title}</h1><p>{description}</p></div></div>
    <form className="card" onSubmit={submit}>
      <AIFieldPresets fields={fields} samples={samples} disabled={request.loading} context={title} onFill={(sample, index) => { setValues(completeExample(fields, sample, index, title, values)); request.setResult(null); request.setError(null); }} />
      {fields.map(field => <div className="form-group" key={field.key}><label htmlFor={'native-' + field.key}>{field.label}{field.required ? ' *' : ' (optional)'}</label>{field.type === 'textarea' || field.type === 'json' ? <textarea id={'native-' + field.key} value={values[field.key] ?? ''} rows={4} maxLength={field.maxLength} required={field.required} disabled={request.loading} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))} /> : field.type === 'select' ? <select id={'native-' + field.key} value={values[field.key] ?? ''} required={field.required} disabled={request.loading} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))}><option value="">Select a value</option>{field.options.map(value => <option key={value} value={value}>{value}</option>)}</select> : <input id={'native-' + field.key} type={field.type || 'text'} value={values[field.key] ?? ''} min={field.min} max={field.max} step={field.step} maxLength={field.maxLength} required={field.required} disabled={request.loading} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))} />}</div>)}
      <p className="ai-muted">Examples are fictional planning drafts. Review every value before requesting AI. They do not establish evidence, grant authority, approve actions or execute a workflow.</p>
      <div className="sr-actions"><button className="btn ai" type="submit" disabled={request.loading}>{request.loading ? 'Generating…' : 'Generate with OpenRouter'}</button><button className="btn secondary" type="button" onClick={cancel}>Cancel</button></div>
    </form>
    {request.notice && <p role="status">{request.notice}</p>}
    <AIResultView result={report?.result ?? report} title={title} loading={request.loading} error={request.error} model={report?.providerReceipt?.model} />
    {report?.providerReceipt && <p className="ai-muted">Provider receipt: {report.providerReceipt.requestId} · {report.providerReceipt.model}</p>}
    {loadHistory && <section className="card" style={{ marginTop: 20 }}><h2>Saved reports</h2>{historyLoading && <p role="status">Loading owned reports…</p>}{historyError && <div role="alert">{historyError} <button type="button" onClick={() => setHistoryRevision(value => value + 1)}>Retry saved reports</button></div>}{!historyLoading && !historyError && !items.length && <p>No owned report has been saved yet.</p>}{!historyError && items.length > 0 && <div className="sr-table-wrap"><table><thead><tr><th>Report</th><th>Created</th><th>Actions</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><button className="btn secondary" type="button" onClick={() => setSelected(item)}>{title} #{item.id}</button></td><td>{item.created_at ? new Date(item.created_at).toLocaleString() : 'Not recorded'}</td><td><button className="btn secondary" type="button" onClick={() => setSelected(item)}>View report</button></td></tr>)}</tbody></table></div>}</section>}
    {selected && <div className="sr-dialog-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,18,32,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000 }}><section ref={dialog} role="dialog" aria-modal="true" aria-label="Saved native AI report" tabIndex={-1} className="card" style={{ width: 'min(1100px,94vw)', maxHeight: '90vh', overflow: 'auto' }}><AIResultView result={selected.output} title={title} model={selected.provider_model} /><p>Provider reports are retained. Edit loads the saved input for a new generation and preserves the original report.</p><div className="sr-actions"><button type="button" className="btn secondary" disabled={request.loading} onClick={() => { setValues(Object.fromEntries(fields.map(field => [field.key, selected.input?.[field.key] ?? '']))); setSelected(null); request.setResult(null); }}>Edit input for new generation</button><button type="button" className="btn secondary" disabled title="Retained provider report">Delete retained report</button><button type="button" className="btn secondary" onClick={() => setSelected(null)}>Cancel</button></div></section></div>}
  </div>;
}
