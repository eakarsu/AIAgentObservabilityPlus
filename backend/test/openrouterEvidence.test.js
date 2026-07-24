const test = require('node:test');
const assert = require('node:assert/strict');

const { callOpenRouterEvidence } = require('../services/ai');

test('requires the canonical OpenRouter endpoint', async () => {
  const original = { ...process.env };
  process.env.OPENROUTER_API_KEY = 'unit-test-key';
  process.env.OPENROUTER_MODEL = 'unit-test-model';
  process.env.OPENROUTER_BASE_URL = 'https://example.test/api/v1';
  await assert.rejects(() => callOpenRouterEvidence('system', 'user'), /canonical OpenRouter endpoint/);
  process.env = original;
});

test('returns substantive provider evidence', async () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  process.env.OPENROUTER_API_KEY = 'unit-test-key';
  process.env.OPENROUTER_MODEL = 'unit-test-model';
  process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
  global.fetch = async (url) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    return {
      ok: true,
      json: async () => ({
        id: 'generation-unit-test',
        model: 'unit-test-model',
        choices: [{ message: { content: '{"controls":["retain source spans","authorize evaluation changes","require human incident review"]}' } }],
      }),
    };
  };
  const evidence = await callOpenRouterEvidence('system', 'user');
  assert.equal(evidence.providerReceipt.provider, 'openrouter');
  assert.equal(evidence.providerReceipt.requestId, 'generation-unit-test');
  assert.ok(evidence.result.length > 40);
  global.fetch = originalFetch;
  process.env = originalEnv;
});
