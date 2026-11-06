# Security boundary

## What the open shell can do

| Capability | Allowed? | Notes |
|---|---|---|
| Open a side panel | Yes | `sidePanel` permission |
| Read the active tab | Only on user invocation | `activeTab`, no content script |
| Store local UI state | Yes | `storage` permission |
| Execute remote code | No | CSP `script-src 'self'` |
| Use `eval` | No | CSP has no `unsafe-eval` |
| Native messaging | No | Permission omitted; test enforces it |
| Start a local process | No | No native host in this repo |
| Reach Office | No | Add-in and bridge are private |
| Read the filesystem | No | No API in the shell |

## Why native messaging is omitted

The production companion is the privileged component. It can start a harness process, read workspace roots, serve the Office add-in over localhost HTTPS, and update the extension. Shipping a native-messaging manifest in a public shell would invite a user to install a host with no security review of the host itself.

The open shell is therefore deliberately useless as a local agent: it can render a conversation and run a demo adapter, nothing more. That is the point.

## Manifest guard

`assertNoNativeMessaging` in `shared/adapter.js` throws if the manifest requests `nativeMessaging` or exposes `externally_connectable`. The test suite runs it against the real manifest.

## CSP

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

No CDN, no inline script, no remote asset. The side panel imports one local ES module.

## Production controls (not in this repo)

- The native host manifest is registered per user, not globally.
- The host accepts only the extension ID and a bounded message schema.
- Harness processes run with the user's permissions; the product does not elevate.
- Office registration uses a locally generated certificate; private keys stay on the machine.
- Updates verify a published checksum and take no path or command from the page.
- Conversations and workspace data stay local; the hosted service is not in the loop.

## Reporting

Security issues in the public shell: `hello@synthworx.com` with `SECURITY` in the subject. See the website's [security page](https://synthworx.com/security) for the client-data policy.
