// `reply_to_id` has always worked on the REST API and has always been in the
// docs, but the SDK never mapped it — so it was unreachable from here and from
// the MCP server that sits on top (ticket #4710). These tests pin the mapping.
//
// No network: axios is given an adapter that records the request, so every
// assertion is about what the SDK would have sent.

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { UploadPost } from '../index.js';

let sent;

beforeEach(() => {
  sent = [];
  axios.defaults.adapter = async (config) => {
    sent.push(config);
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
  };
});

const client = () => new UploadPost('test-key');
const last = () => sent[sent.length - 1];

/** Read back the fields a multipart upload would have written. */
function formFields(form) {
  const boundary = form.getBoundary();
  const body = form.getBuffer().toString('utf8');
  const fields = {};
  for (const part of body.split(`--${boundary}`)) {
    const match = part.match(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n$/);
    if (match) fields[match[1]] = match[2];
  }
  return fields;
}

const base = { user: 'my-profile', title: 'A reply', platforms: ['x'] };

describe('replyToId reaches the API as reply_to_id', () => {
  test('uploadText sends it', async () => {
    await client().uploadText({ ...base, replyToId: '2096858111369760964' });
    assert.equal(formFields(last().data).reply_to_id, '2096858111369760964');
  });

  test('xReplyToId is accepted as the X-scoped alias', async () => {
    await client().uploadText({ ...base, xReplyToId: '2096858111369760964' });
    assert.equal(formFields(last().data).reply_to_id, '2096858111369760964');
  });

  test('blueskyReplyToId takes an AT-URI', async () => {
    await client().uploadText({
      ...base, platforms: ['bluesky'],
      blueskyReplyToId: 'at://did:plc:abc123/app.bsky.feed.post/xyz',
    });
    assert.equal(formFields(last().data).reply_to_id,
      'at://did:plc:abc123/app.bsky.feed.post/xyz');
  });

  test('the generic name wins when both are given', async () => {
    await client().uploadText({ ...base, replyToId: '111', xReplyToId: '222' });
    assert.equal(formFields(last().data).reply_to_id, '111');
  });

  test('nothing is sent when the caller did not ask for a reply', async () => {
    await client().uploadText({ ...base });
    assert.equal('reply_to_id' in formFields(last().data), false);
  });
});
