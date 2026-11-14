// Native commercial disclosure (TT-988): `paid_partnership`, `facebook_sponsor_id`
// and `pinterest_sponsor_id` are API fields the SDK never mapped. These tests pin
// the mapping through the public methods, and pin the contract that a request
// that sets none of them sends none of them (the API then behaves as before).
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

const NEW_FIELDS = ['paid_partnership', 'facebook_sponsor_id', 'pinterest_sponsor_id'];
const VIDEO = 'https://example.com/clip.mp4';
const PHOTO = 'https://example.com/pic.jpg';
const all = ['tiktok', 'youtube', 'x', 'facebook', 'pinterest'];

describe('paidPartnership', () => {
  test('upload() sends paid_partnership=true', async () => {
    await client().upload(VIDEO, { user: 'u', title: 't', platforms: ['tiktok', 'youtube', 'x'], paidPartnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('uploadPhotos() sends it', async () => {
    await client().uploadPhotos([PHOTO], { user: 'u', title: 't', platforms: ['tiktok', 'x'], paidPartnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('uploadText() sends it', async () => {
    await client().uploadText({ user: 'u', title: 't', platforms: ['x'], paidPartnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('an explicit false is sent as false (the API reads it as "no alias")', async () => {
    await client().uploadText({ user: 'u', title: 't', platforms: ['x'], paidPartnership: false });
    assert.equal(formFields(last().data).paid_partnership, 'false');
  });

  test('the snake_case API name is accepted, camelCase wins when both are given', async () => {
    await client().uploadText({ user: 'u', title: 't', platforms: ['x'], paid_partnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
    await client().uploadText({ user: 'u', title: 't', platforms: ['x'], paidPartnership: false, paid_partnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'false');
  });

  test('it is a separate field: it does not set the network-specific ones', async () => {
    await client().upload(VIDEO, { user: 'u', title: 't', platforms: all, paidPartnership: true });
    const fields = formFields(last().data);
    assert.equal(fields.paid_partnership, 'true');
    for (const name of ['brand_content_toggle', 'hasPaidProductPlacement', 'x_paid_partnership']) {
      assert.equal(fields[name], undefined, `${name} must not be set by the SDK; the API maps the alias`);
    }
  });

  test('the network-specific fields still go next to it unchanged', async () => {
    await client().upload(VIDEO, {
      user: 'u', title: 't', platforms: all,
      paidPartnership: true, brandContentToggle: false, youtubeHasPaidProductPlacement: true, xPaidPartnership: false,
    });
    const fields = formFields(last().data);
    assert.equal(fields.paid_partnership, 'true');
    assert.equal(fields.brand_content_toggle, 'false');
    assert.equal(fields.hasPaidProductPlacement, 'true');
    assert.equal(fields.x_paid_partnership, 'false');
  });
});

describe('facebookSponsorId', () => {
  const opts = { user: 'u', title: 't', platforms: ['facebook'], facebookPageId: '111', facebookSponsorId: '222333' };

  test('Page video', async () => {
    await client().upload(VIDEO, { ...opts, facebookMediaType: 'VIDEO' });
    const fields = formFields(last().data);
    assert.equal(fields.facebook_sponsor_id, '222333');
    assert.equal(fields.facebook_media_type, 'VIDEO');
  });

  test('photo post', async () => {
    await client().uploadPhotos([PHOTO], opts);
    assert.equal(formFields(last().data).facebook_sponsor_id, '222333');
  });

  test('text post', async () => {
    await client().uploadText(opts);
    assert.equal(formFields(last().data).facebook_sponsor_id, '222333');
  });

  test('snake_case name, and a numeric id goes as text', async () => {
    await client().uploadText({ ...opts, facebookSponsorId: undefined, facebook_sponsor_id: 222333 });
    assert.equal(formFields(last().data).facebook_sponsor_id, '222333');
  });

  test('only when Facebook is a target platform', async () => {
    await client().upload(VIDEO, { ...opts, platforms: ['tiktok'] });
    assert.equal(formFields(last().data).facebook_sponsor_id, undefined);
  });

  test('an empty id is not sent', async () => {
    await client().uploadText({ ...opts, facebookSponsorId: '' });
    assert.equal(formFields(last().data).facebook_sponsor_id, undefined);
  });
});

describe('pinterestSponsorId', () => {
  const opts = { user: 'u', title: 't', platforms: ['pinterest'], pinterestBoardId: 'b1', pinterestSponsorId: '5550001' };

  test('video pin', async () => {
    await client().upload(VIDEO, opts);
    assert.equal(formFields(last().data).pinterest_sponsor_id, '5550001');
  });

  test('image pin', async () => {
    await client().uploadPhotos([PHOTO], opts);
    assert.equal(formFields(last().data).pinterest_sponsor_id, '5550001');
  });

  test('snake_case name', async () => {
    await client().upload(VIDEO, { ...opts, pinterestSponsorId: undefined, pinterest_sponsor_id: '77' });
    assert.equal(formFields(last().data).pinterest_sponsor_id, '77');
  });

  test('only when Pinterest is a target platform', async () => {
    await client().upload(VIDEO, { ...opts, platforms: ['x'] });
    assert.equal(formFields(last().data).pinterest_sponsor_id, undefined);
  });
});

describe('nothing is sent unless asked for', () => {
  test('video, photo and text requests carry none of the new fields', async () => {
    await client().upload(VIDEO, { user: 'u', title: 't', platforms: all, facebookPageId: '1', pinterestBoardId: 'b' });
    await client().uploadPhotos([PHOTO], { user: 'u', title: 't', platforms: all, facebookPageId: '1', pinterestBoardId: 'b' });
    await client().uploadText({ user: 'u', title: 't', platforms: ['x', 'facebook'], facebookPageId: '1' });
    assert.equal(sent.length, 3);
    for (const request of sent) {
      const fields = formFields(request.data);
      for (const name of NEW_FIELDS) assert.equal(fields[name], undefined, `${name} must be absent`);
    }
  });
});

describe('scheduled posts', () => {
  test('editScheduled forwards the new fields through `fields` (no SDK change needed)', async () => {
    await client().editScheduled('job-1', { fields: { paid_partnership: true, facebook_sponsor_id: '222333' } });
    const body = JSON.parse(last().data);
    assert.deepEqual(body.fields, { paid_partnership: true, facebook_sponsor_id: '222333' });
  });
});
