// The upload methods build the multipart body from per-platform whitelists:
// a field that is not listed is dropped without a word (AGENTS.md, rule 6).
// This checks every form field the spec gives the four upload endpoints
// against what upload(), uploadPhotos(), uploadText() and uploadDocument()
// actually send. A field the API gains in codegen/openapi.json fails here
// until the SDK forwards it.

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import { UploadPost } from '../index.js';

const spec = JSON.parse(fs.readFileSync(new URL('../codegen/openapi.json', import.meta.url)));
const resolve = (node) => {
  while (node && node.$ref) node = node.$ref.slice(2).split('/').reduce((n, part) => n[part], spec);
  return node || {};
};
const props = (schema) => {
  schema = resolve(schema);
  const out = {};
  for (const sub of schema.allOf || []) Object.assign(out, props(sub));
  return Object.assign(out, schema.properties || {});
};
const isBinary = (s) => resolve(s).format === 'binary' || resolve(resolve(s).items).format === 'binary';
const pascal = (name) => name.replace(/(^|_)([a-zA-Z0-9])/g, (_, __, c) => c.toUpperCase());
const camel = (name) => { const p = pascal(name); return p[0].toLowerCase() + p.slice(1); };

const PLATFORMS = ['tiktok', 'instagram', 'youtube', 'linkedin', 'facebook', 'pinterest', 'threads', 'reddit',
  'bluesky', 'x', 'google_business', 'discord', 'telegram', 'mastodon', 'wordpress', 'lemmy', 'slack', 'nostr',
  'devto', 'hashnode', 'whop', 'listmonk'];
// Option prefixes: the SDK names most fields `<platform><Field>` (tiktokPrivacyLevel -> privacy_level).
const PREFIXES = ['tiktok', 'instagram', 'youtube', 'linkedin', 'facebook', 'pinterest', 'threads', 'reddit',
  'bluesky', 'x', 'googleBusiness', 'gbp', 'discord', 'telegram', 'mastodon', 'wordpress', 'lemmy', 'slack',
  'nostr', 'devto', 'hashnode', 'whop', 'listmonk'];
// Fields sent from an option that also sends another field, checked on their own below.
const SEPARATE = { cover_image: 'instagramCoverUrl with a local file (cover_url with a URL)' };
// Fields the method itself takes as an argument, or that the SDK fills in.
const STRUCTURAL = new Set(['video', 'photos', 'document', 'platform', 'user', 'title']);
// Fields the SDK knowingly does not send, with the reason. Keep it empty.
const NOT_SENT = {};

const UPLOADS = [
  ['/upload', 'upload', () => ['https://example.com/v.mp4']],
  ['/upload_photos', 'uploadPhotos', () => [['https://example.com/a.jpg']]],
  ['/upload_text', 'uploadText', () => []],
  ['/upload_document', 'uploadDocument', () => ['https://example.com/a.pdf']],
];

let sent;
beforeEach(() => {
  axios.defaults.adapter = async (config) => {
    sent = config;
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
  };
});

const tmpFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'up-fields-')), 'file.jpg');
fs.writeFileSync(tmpFile, 'x');

describe('uploads send every form field the API accepts', () => {
  for (const [route, method, leading] of UPLOADS) {
    const schema = spec.paths[route].post.requestBody.content['multipart/form-data'].schema;
    const fields = Object.entries(props(schema)).map(([name, s]) => [name.replace(/\[\]$/, ''), s]);

    test(`${method} (${route}): ${fields.length} fields`, async () => {
      const options = { platforms: PLATFORMS, user: 'u', title: 't' };
      for (const [field, s] of fields) {
        if (STRUCTURAL.has(field)) continue;
        const binary = isBinary(s);
        const value = binary ? (resolve(s).type === 'array' ? [tmpFile] : tmpFile) : 'https://example.com/value';
        for (const key of [field, camel(field), ...PREFIXES.map((p) => p + pascal(field))]) {
          if (!(key in options)) options[key] = value;
        }
      }
      await new UploadPost('test-key')[method](...leading(), options);
      // Part headers are strings in the form's queue (file parts are streams).
      const headers = sent.data._streams.filter((part) => typeof part === 'string').join('');
      const got = new Set([...headers.matchAll(/name="([^"]+)"/g)].map((m) => m[1].replace(/\[\]$/, '')));
      const dropped = fields.map(([f]) => f).filter((f) => !STRUCTURAL.has(f) && !got.has(f) && !NOT_SENT[f] && !SEPARATE[f]);
      assert.deepEqual(dropped, [], `${method} drops these API fields: ${dropped.join(', ')}`);
    });
  }
});

describe('the fields added for the spec', () => {
  test('instagramCoverUrl with a local file sends cover_image', async () => {
    await new UploadPost('k').upload('https://example.com/v.mp4', { user: 'u', title: 't', platforms: ['instagram'], instagramCoverUrl: tmpFile });
    const headers = sent.data._streams.filter((part) => typeof part === 'string').join('');
    assert.match(headers, /name="cover_image"/);
  });

  test('youtubeThumbnail with a local file sends thumbnail', async () => {
    await new UploadPost('k').upload('https://example.com/v.mp4', { user: 'u', title: 't', platforms: ['youtube'], youtubeThumbnail: tmpFile });
    const headers = sent.data._streams.filter((part) => typeof part === 'string').join('');
    assert.match(headers, /name="thumbnail"; filename="file.jpg"/);
  });

  test('uploadDocument sends to Telegram with its options', async () => {
    await new UploadPost('k').uploadDocument('https://example.com/a.zip', {
      user: 'u', title: 't', platforms: ['telegram'], telegramSendByUrl: true, telegramAllowPaidBroadcast: true,
    });
    const body = sent.data.getBuffer().toString('utf8');
    assert.match(body, /name="platform\[\]"\r\n\r\ntelegram\r\n/);
    assert.doesNotMatch(body, /\r\n\r\nlinkedin\r\n/);
    assert.match(body, /name="telegram_send_by_url"\r\n\r\ntrue/);
  });

  test('uploadDocument still defaults to LinkedIn and ignores other platforms', async () => {
    await new UploadPost('k').uploadDocument('https://example.com/a.pdf', { user: 'u', title: 't', platforms: ['x'] });
    const body = sent.data.getBuffer().toString('utf8');
    assert.match(body, /name="platform\[\]"\r\n\r\nlinkedin\r\n/);
    assert.doesNotMatch(body, /\r\n\r\nx\r\n/);
  });

  test('X exclude_reply_user_ids goes as a list', async () => {
    await new UploadPost('k').uploadText({ user: 'u', title: 't', platforms: ['x'], xExcludeReplyUserIds: ['1', '2'] });
    const body = sent.data.getBuffer().toString('utf8');
    assert.equal([...body.matchAll(/name="exclude_reply_user_ids\[\]"/g)].length, 2);
  });
});
