# Korala for Cursor

One-click install (no plugin needed):

```
cursor://anysphere.cursor-deeplink/mcp/install?name=korala&config=eyJ1cmwiOiJodHRwczovL2FwaS5rb3JhbGEuYWkvbWNwIn0=
```

`config` is base64 of `{"url":"https://api.korala.ai/mcp"}`. Cursor registers
itself with Korala and opens a browser to sign in.

This directory is the Cursor Marketplace plugin: `.cursor-plugin/plugin.json`
plus `mcp.json`. Cursor requires marketplace plugins to be open source and
reviews each one by hand, so publish it as a public repository and submit it at
https://cursor.com/marketplace/publish. We have not submitted it yet, and we
could not read the submission form's fields, so check the manifest against the
form before submitting.
