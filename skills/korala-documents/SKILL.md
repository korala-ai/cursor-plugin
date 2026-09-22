---
name: korala-documents
description: Draft a rental agreement, contract or other document, turn it into a Korala signing request for the people the user names, send it when the user says so, and track who has signed. Works through the Korala MCP tools when Korala is connected, and through a no-account draft link when it is not.
---

# Korala documents

## First, check whether Korala is connected

Look for the Korala MCP tools (`list_templates`, `create_markdown_template`,
`create_document_from_template`, `send_document`, `get_document`).

- **Tools available:** follow "With Korala connected".
- **Korala listed but not signed in:** tell the user to open the
  **Customize** page in Cursor's sidebar and sign in next to **korala**. They
  pick what you may do on Korala's consent page. Then continue.
- **No tools:** follow "Without an account". Do not ask for API keys.

## With Korala connected

1. `list_templates` first. The user may already have a template for this.
2. Draft Markdown (syntax below). Keep wording the user approved. Ask for
   missing terms that change the agreement, or leave a clear placeholder. Do
   not invent commercial terms, names or email addresses.
3. `preview_markdown_template` and tell the user the page count, the variables
   it expects and the signature roles.
4. `create_markdown_template`, then `create_document_from_template` with one
   signer per role (role names, not ids) and explicit `templateData`.
5. The result is a draft. Say so, and give the document id.
6. Call `send_document` only when the user asked you to send this document.
   If the connection may not send, the tool returns a `reviewUrl`: give the
   user that link so they can review and send it themselves. The same applies
   to `void_document`.
7. `get_document` to report status. "pending" means sent and waiting. It does
   not mean signed.

You can never sign for anyone, and no tool does.

## Without an account

1. Draft Markdown and example JSON into local files.
2. Build a draft link with the bundled helper (Node 22 or later, no packages
   or credentials):

   ```sh
   node "<path-to-this-skill>/scripts/korala.mjs" playground agreement.md example.json "Rental agreement"
   ```

3. Give the user the printed URL as an **Open in Korala** link. They review
   the rendered draft and choose **Save in Korala**, signing in or creating an
   account there. Nothing is saved or sent until they do, so do not say it
   was.

The draft travels in the URL fragment. Anyone with the link can read it: use
example data, never credentials or private customer data. Drafts over 64 KiB
do not fit in a link; give the user the Markdown to paste into
https://korala.ai/markdown-playground instead.

## Template syntax

Full guide: https://docs.korala.ai/guides/markdown-templates

Markdown with Liquid variables (`{{ tenant.name }}`) and `if`, `unless` and
`for` blocks. Only the `upcase` and `downcase` filters exist. Format money and
dates in the data. Keep variables out of code, links and directive attributes.
No raw HTML, images, includes or JavaScript.

Put `::signature{role="tenant" label="Tenant signature"}` at the document
root. Group one or two in `:::signatures` / `:::` for side-by-side signature
spaces. Roles must be unique, unconditional and the same for every data
variation. `::pagebreak` starts a new page. A template allows eight roles and
200 items per array.
