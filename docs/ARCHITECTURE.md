# Architecture

## The product

Tappi for Chrome is a sidebar that drives an installed local coding-agent harness (Codex, Claude Code, Kiro) inside the user's own Chrome session. The full product adds native working folders, selected text and image snips, isolated agent tab groups, mobile emulation, design previews, and a bundled Office add-in.

## The public slice

This repo is the UI shell and the adapter contract:

```text
sidepanel.html / sidepanel.js
        │
        ▼
shared/adapter.js  ── validateAdapter, createDemoAdapter
        │
        ▼
   HarnessAdapter
```

The demo adapter is deterministic and local. It exists so the shell can be run and tested without a native host.

## The production slice

```text
Chrome extension
  ├── side panel
  ├── service worker
  ├── content-side adapters (private)
  └── chrome.runtime.connectNative
          │
          ▼
  local companion (private)
    ├── harness discovery (Codex / Claude Code / Kiro)
    ├── process lifecycle and streaming
    ├── workspace roots
    ├── Office bridge + localhost certificate
    └── update helper
```

The native host is where the privileged work happens. It is deliberately outside this repo.

## Sequence: a message

1. User types in the side panel.
2. `sidepanel.js` calls `adapter.send({ text })`.
3. In production, the adapter sends the request over native messaging to the companion.
4. The companion starts or resumes the selected harness, streams events back, and enforces cancellation.
5. The side panel renders the stream and stores the conversation locally.

In this shell, step 3 is replaced by a fixed local response. The UI path is identical.

## Why the adapter is small

The sidebar should not know whether the harness is Codex, Claude Code, or Kiro. It should know:

- Which harnesses and models are available.
- How to send a message.
- How to cancel.
- How to stream an event.

Everything else belongs to the adapter. That keeps the UI stable when a harness changes its CLI or event format.

## What is intentionally absent

- Native messaging permission.
- Native host manifest.
- Harness launch and streaming.
- Office add-in and certificates.
- Packaging and update code.
- Customer data, prompts, recipes, and conversation histories.

## Testing strategy

The open shell tests the contract, the manifest, and the security boundary. The production test suite (69 test files in the reference build) covers the native host, harness adapters, Office tools, browser input, and packaging. Those tests are not published because the code they exercise is not published.

## Compatibility

Chrome 125+ (side panel and MV3). The production product additionally requires a local companion and an installed, signed-in harness.
