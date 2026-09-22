# Korala for Cursor

One-click install (no plugin needed):

```
cursor://anysphere.cursor-deeplink/mcp/install?name=korala&config=eyJ1cmwiOiJodHRwczovL2FwaS5rb3JhbGEuYWkvbWNwIn0=
```

`config` is base64 of `{"url":"https://api.korala.ai/mcp"}`. Cursor registers
itself with Korala and opens a browser to sign in.

This directory is the Cursor Marketplace plugin, published as
https://github.com/korala-ai/cursor-plugin:

- `.cursor-plugin/plugin.json`: the manifest.
- `mcp.json`: the hosted Korala MCP server (`https://api.korala.ai/mcp`,
  OAuth sign-in, no keys).
- `skills/korala-documents`: how to draft, prepare, send and track with those
  tools, and the no-account draft link for people who have not connected.

Cursor requires marketplace plugins to be open source and reviews each one by
hand; submit it at https://cursor.com/marketplace/publish. We have not
submitted it yet, and we could not read the submission form's fields, so check
the manifest against the form before submitting.

## Keeping the helper in sync

`skills/korala-documents/scripts/korala.mjs` is a copy of
`integrations/agent-skills/korala-documents/scripts/korala.mjs`.
`node scripts/package-integrations.mjs --check` fails when they differ.
