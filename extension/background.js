// A minimal MV3 service worker. The production companion owns harness
// discovery, native messaging, and Office registration. This shell opens its
// side panel and nothing else.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('side panel registration failed', error));
