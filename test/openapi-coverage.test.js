// The SDK covers the whole API: every operation of codegen/openapi.json has a
// method (hand-written ones are listed in codegen/sdk-map.json, the rest are
// generated), and calling that method sends the HTTP method and path the spec
// describes. A new operation in the spec fails here until it has a method:
// run `python3 codegen/generate.py`.
//
// No network: axios is given an adapter that records the request.

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import axios from 'axios';
import { UploadPost } from '../index.js';

const spec = JSON.parse(fs.readFileSync(new URL('../codegen/openapi.json', import.meta.url)));
const map = JSON.parse(fs.readFileSync(new URL('../codegen/sdk-map.json', import.meta.url)));
const dts = fs.readFileSync(new URL('../index.d.ts', import.meta.url), 'utf8');
const TABLE = UploadPost.OPENAPI_OPERATIONS;

let sent;
beforeEach(() => {
  sent = [];
  axios.defaults.adapter = async (config) => {
    sent.push(config);
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
  };
});

const camel = (name) => name.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const resolve = (node) => {
  while (node && node.$ref) {
    node = node.$ref.slice(2).split('/').reduce((n, part) => n[part], spec);
  }
  return node || {};
};

const OPS = [];
for (const [route, item] of Object.entries(spec.paths)) {
  for (const verb of ['get', 'post', 'put', 'patch', 'delete']) {
    const op = item[verb];
    if (!op) continue;
    const params = [...(item.parameters || []), ...(op.parameters || [])].map(resolve);
    const required = new Set(params.filter((p) => p.in !== 'header' && p.required).map((p) => p.name));
    for (const content of Object.values(op.requestBody?.content || {})) {
      for (const name of resolve(content.schema).required || []) required.add(name);
    }
    OPS.push({ id: op.operationId, verb: verb.toUpperCase(), route, required: [...required], security: op.security });
  }
}

const generatedFor = (op) => Object.entries(TABLE).find(([, [verb, route]]) => verb === op.verb && route === op.route);
const methodFor = (op) => map.existing[op.id] || generatedFor(op)?.[0];
const routeRegex = (route) => new RegExp(
  '^' + route.replace(/\/$/, '').replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\w+\}/g, '[^/]+') + '/?$');

// Arguments for a method: positional parameters get a string (an array for
// photo lists, a URL for media), the options object gets every required field.
function argsFor(name, op) {
  const options = {
    user: 'v_user', profileUsername: 'v_profile', platform: 'x', platforms: ['x'], title: 't', token: 'jwt',
  };
  for (const field of op.required) if (!(camel(field) in options)) options[camel(field)] = `v_${field}`;
  const src = UploadPost.prototype[name].toString();
  const list = (src.match(/^[^(]*\(([^)]*)\)/) || [])[1] || '';
  return list.split(',').map((p) => p.trim().split('=')[0].trim()).filter(Boolean).map((param) => {
    if (/^(options|opts|params|settings|body|config)$/i.test(param) || param.startsWith('{')) return options;
    if (/photos/i.test(param)) return ['https://example.com/a.jpg'];
    if (/video|document|media|file/i.test(param)) return 'https://example.com/a.mp4';
    return `v_${param}`;
  });
}

describe('every operation of the spec has a method', () => {
  test('nothing is left without a method or a reason', () => {
    const missing = OPS.filter((op) => !methodFor(op) && !map.excluded[op.id]).map((op) => `${op.id} (${op.verb} ${op.route})`);
    assert.deepEqual(missing, [], `Operations without a method; run python3 codegen/generate.py:\n${missing.join('\n')}`);
  });

  test('codegen/sdk-map.json only names operations of the spec', () => {
    const ids = new Set(OPS.map((op) => op.id));
    const stale = [...Object.keys(map.existing), ...Object.keys(map.excluded)].filter((id) => !ids.has(id));
    assert.deepEqual(stale, []);
    for (const [id, why] of Object.entries(map.excluded)) assert.ok(why.length > 20, `${id} needs a reason`);
  });

  test('the generated table only has operations of the spec, none twice', () => {
    const keys = new Set(OPS.map((op) => `${op.verb} ${op.route}`));
    const extra = Object.entries(TABLE).filter(([, [verb, route]]) => !keys.has(`${verb} ${route}`)).map(([n]) => n);
    assert.deepEqual(extra, [], 'Generated methods for operations that left the spec; run python3 codegen/generate.py');
    const handWritten = OPS.filter((op) => map.existing[op.id] && generatedFor(op)).map((op) => op.id);
    assert.deepEqual(handWritten, [], 'Generated twice: these have a hand-written method');
  });

  test('hand-written methods named in sdk-map.json exist', () => {
    const absent = Object.values(map.existing).filter((name) => typeof UploadPost.prototype[name] !== 'function');
    assert.deepEqual(absent, []);
  });

  test('every generated method is declared in index.d.ts', () => {
    const undeclared = Object.keys(TABLE).filter((name) => !new RegExp(`\\n    ${name}\\(options`).test(dts));
    assert.deepEqual(undeclared, []);
  });
});

describe('each method sends the request of its operation', () => {
  for (const op of OPS) {
    const name = methodFor(op);
    if (!name) continue;
    test(`${op.id} -> ${name}`, async () => {
      await UploadPost.prototype[name].apply(new UploadPost('test-key'), argsFor(name, op));
      assert.ok(sent.length, `${name} sent nothing`);
      const hit = sent.some((c) => c.method.toUpperCase() === op.verb
        && routeRegex(op.route).test(c.url.replace('https://api.upload-post.com/api', '').split('?')[0]));
      assert.ok(hit, `${name} sent ${sent.map((c) => `${c.method.toUpperCase()} ${c.url}`).join(', ')}, not ${op.verb} ${op.route}`);
    });
  }
});

describe('the generated methods', () => {
  test('a bearer operation sends the profile JWT, not the API key', async () => {
    await new UploadPost('test-key').listClientPostApprovals({ token: 'profile-jwt' });
    assert.equal(sent[0].headers.Authorization, 'Bearer profile-jwt');
    await assert.rejects(() => new UploadPost('k').listClientPostApprovals({}), /token/);
  });

  test('path, query and body go where the spec says', async () => {
    await new UploadPost('test-key').testWebhookSubscription({ subscriptionId: 'whsub_1', event: 'upload_completed' });
    assert.equal(sent[0].url, 'https://api.upload-post.com/api/uploadposts/webhooks/subscriptions/whsub_1/test');
    assert.deepEqual(JSON.parse(sent[0].data), { event: 'upload_completed' });

    await new UploadPost('test-key').previewChatgptAdsAd({ adId: 'ad 1', adAccountId: 'acc', extra: true });
    assert.equal(sent[1].url, 'https://api.upload-post.com/api/uploadposts/ads/chatgpt/ads/ad%201/preview');
    assert.deepEqual(sent[1].params, { ad_account_id: 'acc' });
    assert.deepEqual(JSON.parse(sent[1].data), { extra: true });

    await new UploadPost('test-key').listTeamAudit({ profileUsername: 'p', limit: 5 });
    assert.deepEqual(sent[2].params, { profile_username: 'p', limit: 5 });
  });

  test('a missing path parameter fails before any request', async () => {
    await assert.rejects(() => new UploadPost('k').getWebhookSubscription({}), /subscription_id is required/);
    assert.equal(sent.length, 0);
  });

  test('a file download asks for bytes', async () => {
    await new UploadPost('test-key').downloadFfmpegResult({ jobId: 'j' });
    assert.equal(sent[0].responseType, 'arraybuffer');
  });

  test('a local file turns the body into multipart', async () => {
    const tmp = `${fs.mkdtempSync('/tmp/up-')}/a.mp4`;
    fs.writeFileSync(tmp, 'x');
    await new UploadPost('test-key').createFfmpegJob({ file: tmp, fullCommand: 'ffmpeg -i {input} {output}', outputExtension: 'mp4' });
    assert.equal(typeof sent[0].data.getBoundary, 'function', 'not a multipart form');
    assert.match(sent[0].data.getHeaders()['content-type'], /multipart\/form-data/);
  });

  test('a JSON error read as bytes keeps its codes', async () => {
    axios.defaults.adapter = async (config) => {
      const error = new Error('Request failed');
      error.response = { status: 503, data: Buffer.from('{"success":false,"reason":"webhook_subscriptions_disabled"}'), headers: {} };
      throw error;
    };
    await assert.rejects(() => new UploadPost('k').downloadDmMedia({ platform: 'x', user: 'u', mediaId: 'm' }),
      (err) => err.status === 503 && err.reason === 'webhook_subscriptions_disabled');
  });
});
