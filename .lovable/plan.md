

# Tighten Content Security Policy

## Summary

Update the CSP meta tag in `index.html` with three targeted changes: remove `'unsafe-eval'` from `script-src`, remove `http:` from `img-src`, and add third-party API domains to `connect-src`.

## Changes

**File: `index.html`** — single meta tag edit

| Directive | Current | New |
|---|---|---|
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` | `'self' 'unsafe-inline'` |
| `img-src` | `'self' data: blob: https: http:` | `'self' data: blob: https:` |
| `connect-src` | current domains only | add `https://api.resend.com https://api.finix.com https://api.elevenlabs.io https://api.twilio.com https://api.openai.com https://maps.googleapis.com https://accounts.google.com https://oauth2.googleapis.com` |

No other directives (`frame-src`, `font-src`, `style-src`, `media-src`) are touched. No other files modified.

