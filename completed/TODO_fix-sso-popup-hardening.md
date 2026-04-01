# TODO_fix-sso-popup-hardening

- [x] Expand popup allowlist for Google/OpenAI/X auth redirect hosts used in real SSO chains.
- [x] Allow `about:blank` OAuth pre-open popups only when opener/vendor context is trusted.
- [x] Ensure auth popup child windows inherit spoofed Chrome user agent from primary tabs.
- [x] Add popup policy tests for allow/deny cases and global disable behavior.
- [x] Verify with tests (`tests/popup-policy.test.mjs`, `tests/electron-browser-backend.test.mjs`).

