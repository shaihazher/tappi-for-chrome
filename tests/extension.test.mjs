import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  HarnessError,
  assertNoNativeMessaging,
  createDemoAdapter,
  validateAdapter,
} from '../shared/adapter.js';

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const manifest = JSON.parse(read('../extension/manifest.json'));

test('manifest is a minimal MV3 side panel', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.side_panel.default_path, 'sidepanel.html');
  assert.ok(manifest.permissions.includes('sidePanel'));
  assert.equal(manifest.permissions.includes('nativeMessaging'), false);
  assert.equal(manifest.externally_connectable, undefined);
});

test('the open shell refuses native messaging', () => {
  assert.equal(assertNoNativeMessaging(manifest), true);
  assert.throws(
    () => assertNoNativeMessaging({ permissions: ['nativeMessaging'] }),
    (error) => error instanceof HarnessError && error.code === 'unsafe_manifest',
  );
});

test('CSP does not allow remote script or eval', () => {
  const csp = manifest.content_security_policy.extension_pages;
  assert.match(csp, /script-src 'self'/);
  assert.doesNotMatch(csp, /unsafe-eval|https?:/);
});

test('side panel loads only local scripts and styles', () => {
  const html = read('../extension/sidepanel.html');
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.doesNotMatch(match[1], /^https?:/, `remote asset: ${match[1]}`);
  }
  assert.match(html, /<script type="module" src="sidepanel.js">/);
});

test('the demo adapter validates and answers locally', async () => {
  const adapter = createDemoAdapter();
  assert.equal(validateAdapter(adapter), adapter);
  const models = await adapter.listModels();
  assert.equal(models[0].id, 'demo-1');
  const response = await adapter.send({ text: 'What is in this shell?' });
  assert.equal(response.demo, true);
  assert.match(response.text, /no model behind it/);
  await assert.rejects(
    () => adapter.send({ text: '   ' }),
    (error) => error instanceof HarnessError && error.code === 'empty_message',
  );
});

test('adapter validation rejects an incomplete adapter', () => {
  assert.throws(
    () => validateAdapter({ id: 'x', label: 'x' }),
    (error) => error instanceof HarnessError && error.code === 'invalid_adapter',
  );
});

test('no obvious secrets or private host paths in the public shell', () => {
  const files = [
    read('../extension/manifest.json'),
    read('../extension/background.js'),
    read('../extension/sidepanel.html'),
    read('../extension/sidepanel.js'),
    read('../shared/adapter.js'),
  ].join('\n');
  for (const pattern of [/BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/, /ghp_[A-Za-z0-9]{20,}/, /sk-[A-Za-z0-9]{20,}/, /\/Users\/[a-z]/i]) {
    assert.doesNotMatch(files, pattern);
  }
});
