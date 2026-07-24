// LLM helper for Agent Observability Plus
const CANONICAL_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
function creds() {
  const baseUrl = String(process.env.OPENROUTER_BASE_URL || '').replace(/\/$/, '');
  const key = String(process.env.OPENROUTER_API_KEY || '').trim();
  const model = String(process.env.OPENROUTER_MODEL || '').trim();
  if (baseUrl !== CANONICAL_OPENROUTER_BASE_URL) throw new Error('OPENROUTER_BASE_URL must use the canonical OpenRouter endpoint');
  if (!key || !model) throw new Error('OpenRouter key and model must be configured');
  return { baseUrl, key, model };
}
const SYSTEM_BASE = 'You are a senior analyst supporting the Agent Observability Plus. ' +
  'CRITICAL OUTPUT RULES: (1) Return ONLY raw JSON matching the schema requested. ' +
  '(2) DO NOT wrap in markdown fences. (3) DO NOT add prose before/after. ' +
  '(4) Keep concise to fit token limit; never truncate. ' +
  '(5) First char must be `{`, last must be `}`.';

async function callOpenRouterEvidence(systemPrompt, userPrompt) {
  const { baseUrl, key, model } = creds();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': `http://127.0.0.1:${process.env.FRONTEND_PORT || 30021}`,
      'X-Title': 'Agent Observability Plus',
    },
    body: JSON.stringify({
      model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.4, max_tokens: 6000, response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`OpenRouter request failed with status ${response.status}`);
  const requestId = typeof payload?.id === 'string' ? payload.id.trim() : '';
  const providerModel = typeof payload?.model === 'string' ? payload.model.trim() : '';
  const result = typeof payload?.choices?.[0]?.message?.content === 'string' ? payload.choices[0].message.content.trim() : '';
  if (!requestId || !providerModel || result.length < 40) throw new Error('OpenRouter response did not include substantive provider evidence');
  return {
    result,
    providerReceipt: { provider: 'openrouter', requestId, model: providerModel, completedAt: new Date().toISOString() },
  };
}
async function callOpenRouter(systemPrompt, userPrompt) {
  try { return (await callOpenRouterEvidence(systemPrompt, userPrompt)).result; }
  catch (error) { return { error: error.message }; }
}
function stripFences(text) {
  let t = String(text).trim();
  if (t.startsWith('\`\`\`')) {
    t = t.replace(/^\`\`\`(?:json)?\s*/i, '');
    t = t.replace(/\s*\`\`\`\s*$/i, '');
  }
  return t.trim();
}
function repairTruncated(text) {
  if (!text || typeof text !== 'string') return null;
  let inStr = false, esc = false, lastSafe = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === ',' || ch === '}' || ch === ']') lastSafe = i;
  }
  let r = lastSafe >= 0 ? text.slice(0, lastSafe + 1) : text;
  r = r.replace(/,\s*$/, '');
  if (inStr) r += '"';
  const stack = []; let s2 = false, e2 = false;
  for (let i = 0; i < r.length; i++) {
    const ch = r[i];
    if (e2) { e2 = false; continue; }
    if (ch === '\\') { e2 = true; continue; }
    if (ch === '"') { s2 = !s2; continue; }
    if (s2) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') stack.pop();
  }
  while (stack.length) r += (stack.pop() === '{' ? '}' : ']');
  try { return JSON.parse(r); } catch (_) { return null; }
}
function safeParse(response, fallback) {
  if (response && typeof response === 'object' && response.error) return { ...fallback, error: response.error };
  if (response == null) return { ...fallback, summary: '' };
  if (typeof response === 'object') return response;
  const stripped = stripFences(String(response));
  try { return JSON.parse(stripped); } catch (_) {}
  try {
    const start = stripped.indexOf('{');
    if (start !== -1) {
      let d = 0, s = false, e = false;
      for (let i = start; i < stripped.length; i++) {
        const ch = stripped[i];
        if (e) { e = false; continue; }
        if (ch === '\\') { e = true; continue; }
        if (ch === '"') { s = !s; continue; }
        if (s) continue;
        if (ch === '{') d++;
        else if (ch === '}') { d--; if (d === 0) return JSON.parse(stripped.slice(start, i + 1)); }
      }
    }
  } catch (_) {}
  const start = stripped.indexOf('{');
  if (start !== -1) {
    const r = repairTruncated(stripped.slice(start));
    if (r && typeof r === 'object') return { ...r, _truncated: true };
  }
  return { ...fallback, summary: stripped };
}
async function runFeature(slug, schema, payload) {
  const sys = `${SYSTEM_BASE}\nReturn strict JSON in this schema:\n${schema}`;
  const usr = `Feature: ${slug}\nInputs:\n${JSON.stringify(payload, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeParse(r, { summary: typeof r === 'string' ? r : 'No response' });
}
module.exports = { callOpenRouterEvidence, runFeature };
