/**
 * The harness adapter contract, public and sanitized.
 *
 * A real adapter starts a local harness process (Codex, Claude Code, Kiro),
 * streams its events, and exposes model selection. The open shell ships a
 * demo adapter only. The interface is what matters here.
 */

export class HarnessError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'HarnessError';
    this.code = code;
  }
}

export function validateAdapter(adapter) {
  const required = ['id', 'label', 'listModels', 'send'];
  for (const key of required) {
    if (!(key in adapter)) throw new HarnessError('invalid_adapter', `missing ${key}`);
  }
  if (typeof adapter.send !== 'function') {
    throw new HarnessError('invalid_adapter', 'send must be a function');
  }
  return adapter;
}

/**
 * A deterministic adapter for the open shell. It does not call a model,
 * a native host, or the network. Every response says so.
 */
export function createDemoAdapter() {
  const adapter = {
    id: 'demo',
    label: 'Demo adapter',
    async listModels() {
      return [{ id: 'demo-1', label: 'Demo model · local' }];
    },
    async send({ text, signal } = {}) {
      if (typeof text !== 'string' || !text.trim()) {
        throw new HarnessError('empty_message', 'message is empty');
      }
      if (signal?.aborted) throw new HarnessError('aborted', 'request aborted');
      await new Promise((resolve) => setTimeout(resolve, 220));
      return {
        text:
          'This is the open shell. The demo adapter has no model behind it. ' +
          'The production build routes this message to an installed Codex, Claude Code, or Kiro harness through a local native host.',
        citations: [],
        demo: true,
      };
    },
  };
  return validateAdapter(adapter);
}

export function assertNoNativeMessaging(manifest) {
  if (manifest.permissions?.includes('nativeMessaging')) {
    throw new HarnessError('unsafe_manifest', 'the open shell must not request nativeMessaging');
  }
  if (manifest.externally_connectable) {
    throw new HarnessError('unsafe_manifest', 'the open shell must not expose externally_connectable');
  }
  return true;
}
