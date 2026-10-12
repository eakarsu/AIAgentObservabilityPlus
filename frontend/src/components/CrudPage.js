import RecordDialog from './RecordDialog';
import { AIResultValue } from './AIResultView';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { canWrite,archiveAttachment,downloadAttachment } from '../services/api';

/**
 * Generic CRUD page.
 * Props:
 *   - title, subtitle
 *   - api: { list, create, update, remove, bulkImport, listAttachments, uploadAttachment }
 *   - fields: [{ key, label, type?, options? }]  type ∈ text|number|date|datetime-local|select|textarea
 *   - statusKey?: string
 *   - allowAttachments?: boolean (default true)
 *
 * Features:
 *   - Text search across all string fields
 *   - 25 rows/page pagination
 *   - CSV export of filtered rows
 *   - CSV bulk import (writers only)
 *   - Per-row attachment upload + listing (writers can upload)
 *   - Hide write buttons for viewer role
 */
export default function CrudPage({ title, subtitle, api, fields, statusKey, allowAttachments = true }) {
  const PAGE_SIZE = 25;
  const writer = canWrite();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const listRequest = useRef(null);
  const mutationRequest = useRef(null);
  const [mutating, setMutating] = useState(false);

  // attachments panel state
  const [attachRow, setAttachRow] = useState(null);
  const [attachList, setAttachList] = useState([]);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachError, setAttachError] = useState(null);
  const attachFileInputRef = useRef(null);

  // bulk import state
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importFileInputRef = useRef(null);
  const importRequest=useRef(null),attachmentRequest=useRef(null);const [selectedFile,setSelectedFile]=useState(null);

  const emptyDraft = () =>
    Object.fromEntries(fields.map((f) => [f.key, f.type === 'number' ? 0 : '']));

  const load = async () => {
    listRequest.current?.abort();
    const controller = new AbortController(); listRequest.current = controller;
    setLoading(true);
    setErr(null);
    try {
      const data = await api.list({ signal: controller.signal });
      if (!Array.isArray(data)) throw new Error('The records service returned an invalid list.');
      if (listRequest.current === controller && !controller.signal.aborted) setRows(data);
    } catch (e) {
      if (listRequest.current === controller && !controller.signal.aborted) setErr(e.message);
    } finally {
      if (listRequest.current === controller && !controller.signal.aborted) { listRequest.current = null; setLoading(false); }
    }
  };

  useEffect(() => { load(); return () => { listRequest.current?.abort(); listRequest.current = null; mutationRequest.current?.abort(); mutationRequest.current = null;importRequest.current?.abort();importRequest.current=null;attachmentRequest.current?.abort();attachmentRequest.current=null; }; }, []); // eslint-disable-line
  useEffect(() => { setPage(1); }, [search]);

  const openCreate = () => { setDraft(emptyDraft()); setCreating(true); setEditing(null); };
  const openEdit = (row) => { setDraft({ ...row }); setEditing(row); setCreating(false); };
  const cancelMutation = () => { mutationRequest.current?.abort(); mutationRequest.current = null; setMutating(false); };
  const closeModal = () => { cancelMutation(); setCreating(false); setEditing(null); setDraft({}); };

  const handleSave = async () => {
    if (mutationRequest.current) return;
    const controller = new AbortController(); mutationRequest.current = controller; setMutating(true);
    try {
      if (editing) await api.update(editing.id, draft, { signal: controller.signal });
      else await api.create(draft, { signal: controller.signal });
      if (mutationRequest.current !== controller || controller.signal.aborted) return;
      closeModal();
      load();
    } catch (e) { if (mutationRequest.current === controller && !controller.signal.aborted) alert(e.message); }
    finally { if (mutationRequest.current === controller) { mutationRequest.current = null; setMutating(false); } }
  };

  const handleDelete = async (row) => {
    if (mutationRequest.current) return;
    if (!window.confirm(`Delete ${row[fields[0].key] || row.id}?`)) return;
    const controller = new AbortController(); mutationRequest.current = controller; setMutating(true);
    try { await api.remove(row.id, { signal: controller.signal }); if (mutationRequest.current === controller && !controller.signal.aborted) load(); }
    catch (e) { if (mutationRequest.current === controller && !controller.signal.aborted) alert(e.message); }
    finally { if (mutationRequest.current === controller) { mutationRequest.current = null; setMutating(false); } }
  };

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      fields.some((f) => {
        const v = row[f.key];
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, search, fields]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const escapeCsv = (v) => {
    if (v == null) return '';
    let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const handleExportCsv = () => {
    const header = fields.map((f) => escapeCsv(f.label)).join(',');
    const body = filteredRows
      .map((row) => fields.map((f) => escapeCsv(row[f.key])).join(','))
      .join('\n');
    const csv = header + '\n' + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = (title || 'export').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `${safeTitle}_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const closeImport=()=>{importRequest.current?.abort();importRequest.current=null;setImportOpen(false);setImportBusy(false);};
  const handleImportFile=async file=>{if(!file||importRequest.current)return;const controller=new AbortController();importRequest.current=controller;setImportBusy(true);setImportResult(null);try{const text=await file.text();if(controller.signal.aborted)return;const result=await api.bulkImport(text,{signal:controller.signal});if(importRequest.current!==controller||controller.signal.aborted)return;if(!Number.isInteger(result.imported)||!Array.isArray(result.ids))throw Error('The planning import returned an invalid saved-record receipt.');setImportResult(result);load();}catch(failure){if(importRequest.current===controller&&!controller.signal.aborted)setImportResult({error:failure.message});}finally{if(importRequest.current===controller){importRequest.current=null;setImportBusy(false);}}};
  const openAttachments=async row=>{attachmentRequest.current?.abort();const controller=new AbortController();attachmentRequest.current=controller;setAttachRow(row);setAttachLoading(true);setAttachError(null);setAttachList([]);try{const list=await api.listAttachments(row.id,{signal:controller.signal});if(!Array.isArray(list))throw Error('The files service returned an invalid list.');if(attachmentRequest.current===controller&&!controller.signal.aborted)setAttachList(list);}catch(failure){if(attachmentRequest.current===controller&&!controller.signal.aborted)setAttachError(failure.message);}finally{if(attachmentRequest.current===controller){attachmentRequest.current=null;setAttachLoading(false);}}};
  const closeAttachments=()=>{attachmentRequest.current?.abort();attachmentRequest.current=null;setAttachRow(null);setSelectedFile(null);setAttachList([]);setAttachError(null);setAttachLoading(false);};
  const handleAttachFile=async file=>{if(!file||!attachRow||attachmentRequest.current)return;const controller=new AbortController();attachmentRequest.current=controller;setAttachLoading(true);setAttachError(null);try{const saved=await api.uploadAttachment(attachRow.id,file,{signal:controller.signal});if(!saved?.id)throw Error('The source upload did not return a saved attachment.');const list=await api.listAttachments(attachRow.id,{signal:controller.signal});if(!Array.isArray(list))throw Error('The files service returned an invalid list.');if(attachmentRequest.current===controller&&!controller.signal.aborted)setAttachList(list);}catch(failure){if(attachmentRequest.current===controller&&!controller.signal.aborted)setAttachError(failure.message);}finally{if(attachmentRequest.current===controller){attachmentRequest.current=null;setAttachLoading(false);}}};
  const fileAction=async action=>{if(attachmentRequest.current)return;const controller=new AbortController();attachmentRequest.current=controller;setAttachLoading(true);setAttachError(null);try{if(action==='download')await downloadAttachment(selectedFile,{signal:controller.signal});else{if(!window.confirm('Archive this owned attachment from the list? Its original source is retained.'))return;await archiveAttachment(selectedFile.id,{signal:controller.signal});const list=await api.listAttachments(attachRow.id,{signal:controller.signal});if(!Array.isArray(list))throw Error('The files service returned an invalid list.');if(attachmentRequest.current===controller&&!controller.signal.aborted){setAttachList(list);setSelectedFile(null);}}}catch(failure){if(attachmentRequest.current===controller&&!controller.signal.aborted)setAttachError(failure.message);}finally{if(attachmentRequest.current===controller){attachmentRequest.current=null;setAttachLoading(false);}}};
  const renderCell = (row, f) => {
    const v = row[f.key];
    if (v == null) return <span style={{ color: '#64748b' }}>—</span>;
    if (f.key === statusKey || ['status','priority','severity','threat_level','classification','tier','type'].includes(f.key)) {
      const cls = String(v).toLowerCase().replace(/\W+/g, '_');
      return <span className={`badge ${cls}`}>{String(v)}</span>;
    }
    if (typeof v === 'string' && v.length > 80) return v.slice(0, 80) + '…';
    if (f.type === 'datetime-local' && typeof v === 'string') return v.replace('T', ' ').slice(0, 16);
    return String(v);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="page-header-actions">
          {mutating && <button type="button" className="btn secondary" onClick={cancelMutation}>Cancel record request</button>}
          <button className="btn secondary" onClick={handleExportCsv} disabled={filteredRows.length === 0}>
            Export CSV
          </button>
          {writer && (
            <>
              <button
                className="btn secondary"
                onClick={() => { setImportOpen(true); setImportResult(null); }}
              >
                Import CSV
              </button>
              <button className="btn" onClick={openCreate}>+ New</button>
            </>
          )}
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="toolbar-meta">
          {filteredRows.length} record{filteredRows.length === 1 ? '' : 's'}
          {search && rows.length !== filteredRows.length && ` (filtered from ${rows.length})`}
          {!writer && <span style={{ marginLeft: 12, color: '#fbbf24' }}>view-only role</span>}
        </div>
      </div>

      {err && <div className="ai-error" role="alert">Failed to load: {err} <button type="button" className="btn secondary" onClick={load}>Retry loading records</button></div>}

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : err ? null : filteredRows.length === 0 ? (
        <div className="empty-state">
          {rows.length === 0
            ? (writer ? 'No records yet. Click "+ New" to add one.' : 'No records yet.')
            : 'No records match your search.'}
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {fields.map((f) => <th key={f.key}>{f.label}</th>)}
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
                  <tr key={row.id} className="sr-clickable-row" tabIndex={0} onClick={() => setViewing(row)} onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) { event.preventDefault(); setViewing(row); } }}>
                    {fields.map((f, index) => <td key={f.key}>{renderCell(row, f)}{index === 0 && row.record_kind === 'planning_draft' && <small style={{ display: 'block', color: '#94a3b8' }}>Planning draft · no execution or measurement asserted</small>}</td>)}
                    <td style={{ textAlign: 'right' }} onClick={(event) => event.stopPropagation()}>
                      {allowAttachments && (
                        <button className="btn secondary" onClick={() => openAttachments(row)} style={{ marginRight: 6 }}>
                          Files
                        </button>
                      )}
                      {writer && (
                        <>
                          <button className="btn secondary" onClick={() => openEdit(row)} style={{ marginRight: 6 }}>Edit</button>
                          <button className="btn danger" onClick={() => handleDelete(row)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>← Prev</button>
              <span className="page-indicator">Page {safePage} of {totalPages}</span>
              <button className="btn secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next →</button>
            </div>
          )}
        </>
      )}

      {viewing && <RecordDialog title={title + ' · Details'} onClose={() => setViewing(null)}>{viewing.record_kind === 'planning_draft' && <p>This is a planning draft. It does not establish an actual trace, evaluation, alert, deployed prompt or issued credential.</p>}<div className="form-grid">{fields.map((field) => <div className="form-group" key={field.key}><label>{field.label}</label><AIResultValue value={viewing[field.key]} /></div>)}</div><div className="sr-actions">{allowAttachments && <button type="button" className="btn secondary" onClick={() => { const row = viewing; setViewing(null); openAttachments(row); }}>Files</button>}{writer && <><button type="button" className="btn" onClick={() => { const row = viewing; setViewing(null); openEdit(row); }}>Edit</button><button type="button" className="btn danger" onClick={() => { const row = viewing; setViewing(null); handleDelete(row); }}>Delete</button></>}</div></RecordDialog>}

      {(creating || editing) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? `Edit ${title}` : `New ${title}`}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {fields.map((f) => (
                  <div key={f.key} className={`form-group ${f.type === 'textarea' ? 'full-width' : ''}`}>
                    <label>{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={draft[f.key] ?? ''} disabled={mutating} onChange={(e) => setField(f.key, e.target.value)}>
                        <option value="">—</option>
                        {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea value={draft[f.key] ?? ''} disabled={mutating} onChange={(e) => setField(f.key, e.target.value)} />
                    ) : (
                      <input
                        disabled={mutating}
                        type={f.type || 'text'}
                        value={f.type === 'datetime-local' && draft[f.key]
                          ? String(draft[f.key]).slice(0, 16)
                          : (draft[f.key] ?? '')}
                        onChange={(e) =>
                          setField(f.key, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={closeModal}>Cancel</button>
              <button className="btn" disabled={mutating} onClick={handleSave}>{mutating ? 'Saving…' : editing ? 'Save Changes' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="modal-overlay" onClick={closeImport}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Import CSV → {title}</h3>
              <button className="modal-close" onClick={closeImport}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
                CSV header should use these column keys: <code>{fields.map((f) => f.key).join(', ')}</code>.
                First row is treated as a header.
              </p>
              <input
                ref={importFileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleImportFile(e.target.files?.[0])}
              />
              {importBusy && <div className="empty-state">Importing...</div>}
              {importResult&&(importResult.error?<p role="alert">{importResult.error}</p>:<article><h4>Planning import complete</h4><p>{importResult.imported} owned planning drafts saved.</p><p>{importResult.message}</p></article>)}
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={closeImport}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedFile&&<RecordDialog title="Owned attachment details" onClose={()=>{attachmentRequest.current?.abort();attachmentRequest.current=null;setAttachLoading(false);setSelectedFile(null);}}><p>User-supplied attachment. No independent evidence validation or approval is attested.</p><dl><dt>Original filename</dt><dd>{selectedFile.original_name}</dd><dt>Supplied media type</dt><dd>{selectedFile.mimetype}</dd><dt>Stored bytes</dt><dd>{selectedFile.size_bytes}</dd></dl><button disabled title="Retained source contents are preserved">Edit</button> <button disabled={!writer||attachLoading} onClick={()=>fileAction('archive')}>Delete</button> <button disabled={attachLoading} onClick={()=>fileAction('download')}>Download source</button>{attachError&&<p role="alert">{attachError}</p>}</RecordDialog>}
      {attachRow && !selectedFile && (
        <div className="modal-overlay" onClick={closeAttachments}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>Files · {attachRow[fields[0].key] || attachRow.id}</h3>
              <button className="modal-close" onClick={closeAttachments}>×</button>
            </div>
            <div className="modal-body">
              {writer && (
                <div style={{ marginBottom: 12 }}>
                  <input
                    ref={attachFileInputRef}
                    type="file"
                    onChange={(e) => handleAttachFile(e.target.files?.[0])}
                  />
                </div>
              )}
              {attachLoading && <div className="empty-state">Loading...</div>}
              {attachError && <div role="alert" className="ai-error">{attachError} <button onClick={()=>openAttachments(attachRow)}>Retry files</button></div>}
              {!attachLoading && !attachError && attachList.length === 0 && (
                <div className="empty-state">No files attached.</div>
              )}
              {!attachLoading && !attachError && attachList.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {attachList.map((a) => (
                    <li key={a.id} style={{
                      padding: '8px 10px',
                      borderBottom: '1px solid #1e293b',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span>
                        <strong>{a.original_name}</strong>
                        <span style={{ color: '#64748b', marginLeft: 8, fontSize: 12 }}>
                          {a.mimetype} · {Math.round(a.size_bytes / 1024)} KB
                        </span>
                      </span>
                      <button type="button" className="btn secondary" onClick={()=>setSelectedFile(a)}>Open details</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={closeAttachments}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
