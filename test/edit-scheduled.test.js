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

test('forwards per-platform options as fields, youtubePublishAt included', async () => {
  await new UploadPost('k').editScheduled('job1', {
    fields: { privacyStatus: 'unlisted', disable_comment: true, cover_url: null },
    youtubePublishAt: '2026-11-01T09:00:00Z',
  });
  assert.deepEqual(body(), {
    fields: {
      privacyStatus: 'unlisted', disable_comment: true, cover_url: null,
      youtube_publish_at: '2026-11-01T09:00:00Z',
    },
  });
});

test('youtubePublishAt wins over fields and null removes it', async () => {
  await new UploadPost('k').editScheduled('job1', {
    fields: { youtube_publish_at: 'old' }, youtubePublishAt: null,
  });
  assert.deepEqual(body(), { fields: { youtube_publish_at: null } });
});

test('forwards a new cover, or its removal', async () => {
  await new UploadPost('k').editScheduled('job1', {
    coverImageBase64: 'data:image/png;base64,AAAA', coverFilename: 'c.png', coverContentType: 'image/png',
  });
  assert.deepEqual(body(), {
    cover_image_base64: 'data:image/png;base64,AAAA', cover_filename: 'c.png', cover_content_type: 'image/png',
  });
  await new UploadPost('k').editScheduled('job1', { removeCover: true, coverImageBase64: 'AAAA' });
  assert.deepEqual(body(), { remove_cover: true });
});

test('sends no fields key when nothing per-platform is edited', async () => {
  await new UploadPost('k').editScheduled('job1', { scheduledDate: '2026-11-01T09:00:00Z', fields: {} });
  assert.deepEqual(body(), { scheduled_date: '2026-11-01T09:00:00Z' });
});
