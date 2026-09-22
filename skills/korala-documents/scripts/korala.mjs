#!/usr/bin/env node
import { createHash, createHmac } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const [command, ...args] = process.argv.slice(2);
if (!command || command === '--help') {
  console.log(`Korala Markdown helper (Node 22+)
playground SOURCE.md DATA.json NAME   (no account or API keys; prints a draft link)
preview SOURCE.md DATA.json OUTPUT.pdf
create SOURCE.md DATA.json NAME
update TEMPLATE_ID SOURCE.md DATA.json NAME REVISION
get TEMPLATE_ID
generate TEMPLATE_ID DATA.json
create-document TEMPLATE_ID REQUEST.json
send DOCUMENT_ID REQUEST.json
status DOCUMENT_ID

create-document JSON: {"name":"Agreement", "templateData":{...}, "signers":{"ROLE_ID":{"name":"...","email":"..."}}}
Read role IDs with get. Send is a separate operation; use only when authorized.
API commands only: KORALA_API_KEY_ID, KORALA_API_SECRET. Optional KORALA_API_URL.
Open the playground link in the user's browser, or return it as a clickable link.
The user reviews the draft and chooses Save in Korala; sign-in happens there.`);
  process.exit(0);
}
async function json(file) { return JSON.parse(await readFile(file, 'utf8')); }
function id(value) { if (!/^[0-9a-f-]{36}$/i.test(value ?? '')) throw new Error('Expected a UUID'); return value; }
async function source(md, data) { return { source: await readFile(md, 'utf8'), sampleData: await json(data) }; }
async function main() {
  let method = 'POST', path, body, output;
  switch (command) {
    case 'playground': {
      if (args.length !== 3) throw new Error('playground requires SOURCE DATA NAME');
      const draft = await source(args[0], args[1]);
      if (!draft.source.trim() || !args[2].trim() || args[2].length > 255) throw new Error('Provide Markdown source and a name of 1–255 characters');
      if (!draft.sampleData || typeof draft.sampleData !== 'object' || Array.isArray(draft.sampleData)) throw new Error('Example data must be a JSON object');
      const encoded = Buffer.from(JSON.stringify({ version: 1, name: args[2], source: draft.source, data: JSON.stringify(draft.sampleData, null, 2), pageSize: 'A4' }), 'utf8').toString('base64url');
      if (encoded.length > 65536) throw new Error('Draft is too large for a link. Shorten the draft or paste it into https://korala.ai/markdown-playground');
      console.log(`https://korala.ai/markdown-playground#draft=${encoded}`);
      return;
    }
    case 'preview': if (args.length !== 3) throw new Error('preview requires SOURCE DATA OUTPUT'); path = '/templates/markdown/preview'; body = await source(args[0], args[1]); output = args[2]; break;
    case 'create': if (args.length !== 3) throw new Error('create requires SOURCE DATA NAME'); path = '/templates/markdown'; body = { ...await source(args[0], args[1]), name: args[2] }; break;
    case 'update': if (args.length !== 5 || !Number.isSafeInteger(Number(args[4])) || Number(args[4]) < 1) throw new Error('update requires ID SOURCE DATA NAME REVISION'); method = 'PATCH'; path = `/templates/${id(args[0])}/markdown`; body = { ...await source(args[1], args[2]), name: args[3], revision: Number(args[4]) }; break;
    case 'get': method = 'GET'; path = `/templates/${id(args[0])}`; break;
    case 'status': method = 'GET'; path = `/documents/${id(args[0])}`; break;
    case 'generate': path = `/templates/${id(args[0])}/generate`; body = { templateData: await json(args[1]) }; break;
    case 'create-document': path = `/templates/${id(args[0])}/create-document`; body = await json(args[1]); break;
    case 'send': path = `/documents/${id(args[0])}/send`; body = await json(args[1]); break;
    default: throw new Error('Unknown command. Run --help.');
  }
  const key = process.env.KORALA_API_KEY_ID, secret = process.env.KORALA_API_SECRET;
  if (!key || !secret) throw new Error('Set KORALA_API_KEY_ID and KORALA_API_SECRET');
  const base = (process.env.KORALA_API_URL || 'https://api.korala.ai/api/v1').replace(/\/$/, '');
  const url = new URL(`${base}${path}`);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('Use HTTPS, or HTTP on localhost for development');
  const payload = body ? JSON.stringify(body) : '';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const hashedSecret = createHash('sha256').update(secret).digest('hex');
  const signature = createHmac('sha256', hashedSecret).update(`${timestamp}.${method}.${url.pathname}${url.search}.${payload}`).digest('hex');
  const response = await fetch(url, { method, redirect: 'error', signal: AbortSignal.timeout(120000), headers: {
    'x-api-key': key, 'x-timestamp': timestamp, 'x-signature': signature, ...(payload ? { 'content-type': 'application/json' } : {}),
  }, ...(payload ? { body: payload } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(`Korala ${response.status}: ${JSON.stringify(result.message ?? result.error ?? 'Request failed')}`);
  if (output) {
    await writeFile(output, Buffer.from(result.pdfBase64, 'base64'), { flag: 'wx' });
    console.log(JSON.stringify({ file: output, pageCount: result.pageCount, signatures: result.signatures }, null, 2));
  } else console.log(JSON.stringify(result, null, 2));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
