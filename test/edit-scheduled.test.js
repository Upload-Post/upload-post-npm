// editScheduled must forward text edits, not only the date: the SDK builds the
// PATCH body from a fixed list, so any field left out is dropped silently.
//
// No network: axios is given an adapter that records the request.

import { test, beforeEach } from 'node:test';
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

const body = () => JSON.parse(sent[sent.length - 1].data);

test('forwards per-platform text as platform_content', async () => {
  const pc = { instagram: { caption: 'ig' }, tiktok: { caption: 'tt' } };
  await new UploadPost('k').editScheduled('job1', { platformContent: pc });
  assert.equal(sent[0].method.toUpperCase(), 'PATCH');
  assert.match(sent[0].url, /\/uploadposts\/schedule\/job1$/);
  assert.deepEqual(body(), { platform_content: pc });
});

test('forwards title and caption alongside the date', async () => {
  await new UploadPost('k').editScheduled('job1', {
    scheduledDate: '2026-10-01T10:00:00Z', timezone: 'UTC', title: 'T', caption: 'C',
  });
  assert.deepEqual(body(), { scheduled_date: '2026-10-01T10:00:00Z', timezone: 'UTC', title: 'T', caption: 'C' });
});

test('description is an alias of caption, caption wins', async () => {
  await new UploadPost('k').editScheduled('job1', { description: 'D' });
  assert.deepEqual(body(), { description: 'D' });
  await new UploadPost('k').editScheduled('job1', { caption: 'C', description: 'D' });
  assert.deepEqual(body(), { caption: 'C' });
});
