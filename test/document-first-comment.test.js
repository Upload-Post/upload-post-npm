// uploadDocument builds its own form and skipped the first comment: an agent
// reported that LinkedIn document posts could not get one.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UploadPost } from '../index.js';

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

async function send(options) {
  const client = new UploadPost('test-key');
  let captured;
  client._request = async (path, method, form) => { captured = { path, fields: formFields(form) }; return {}; };
  await client.uploadDocument('https://example.com/deck.pdf', { user: 'p', title: 'T', ...options });
  return captured;
}

test('uploadDocument sends firstComment', async () => {
  const { path, fields } = await send({ firstComment: 'Link in the comments' });
  assert.equal(path, '/upload_document');
  assert.equal(fields.first_comment, 'Link in the comments');
});

test('uploadDocument sends linkedinFirstComment', async () => {
  const { fields } = await send({ linkedinFirstComment: 'LinkedIn only' });
  assert.equal(fields.linkedin_first_comment, 'LinkedIn only');
});

test('uploadDocument without a first comment sends neither field', async () => {
  const { fields } = await send({});
  assert.equal('first_comment' in fields, false);
  assert.equal('linkedin_first_comment' in fields, false);
});
