// Native commercial disclosure (TT-988): paidPartnership, the Facebook and
// Pinterest sponsor ids, and editPost for YouTube's paid-promotion declaration.
// A field the SDK does not map is dropped silently, so each one is pinned here.
//
// No network: uploads are captured at _request, editPost through an axios adapter.

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import FormData from 'form-data';
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

function capture() {
  const client = new UploadPost('test-key');
  const calls = [];
  client._request = async (path, method, form) => { calls.push({ path, fields: formFields(form) }); return {}; };
  return { client, calls };
}

describe('paidPartnership', () => {
  test('video upload sends paid_partnership', async () => {
    const { client, calls } = capture();
    await client.upload('https://example.com/v.mp4', {
      user: 'p', title: 'T', platforms: ['tiktok', 'youtube'], paidPartnership: true,
    });
    assert.equal(calls[0].path, '/upload');
    assert.equal(calls[0].fields.paid_partnership, 'true');
  });

  test('photo and text uploads send it too', async () => {
    const photos = capture();
    await photos.client.uploadPhotos(['https://example.com/a.jpg'], {
      user: 'p', title: 'T', platforms: ['facebook'], paidPartnership: true,
    });
    assert.equal(photos.calls[0].fields.paid_partnership, 'true');

    const text = capture();
    await text.client.uploadText({ user: 'p', title: 'T', platforms: ['x'], paidPartnership: true });
    assert.equal(text.calls[0].fields.paid_partnership, 'true');
  });

  test('false is sent (it is a value, not "not set")', async () => {
    const { client, calls } = capture();
    await client.uploadText({ user: 'p', title: 'T', platforms: ['x'], paidPartnership: false });
    assert.equal(calls[0].fields.paid_partnership, 'false');
  });

  test('the API name is accepted', async () => {
    const { client, calls } = capture();
    await client.uploadText({ user: 'p', title: 'T', platforms: ['x'], paid_partnership: true });
    assert.equal(calls[0].fields.paid_partnership, 'true');
  });

  test('left out when not given', async () => {
    const { client, calls } = capture();
    await client.uploadText({ user: 'p', title: 'T', platforms: ['x'] });
    assert.equal('paid_partnership' in calls[0].fields, false);
  });

  test('a network-specific option travels next to it, unchanged', async () => {
    const { client, calls } = capture();
    await client.upload('https://example.com/v.mp4', {
      user: 'p', title: 'T', platforms: ['tiktok', 'youtube', 'x'],
      paidPartnership: true, brandContentToggle: false,
      youtubeHasPaidProductPlacement: false, xPaidPartnership: false,
    });
    const f = calls[0].fields;
    assert.equal(f.paid_partnership, 'true');
    assert.equal(f.brand_content_toggle, 'false');
    assert.equal(f.hasPaidProductPlacement, 'false');
    assert.equal(f.x_paid_partnership, 'false');
  });
});

describe('sponsor ids', () => {
  test('Facebook video, photo and text', () => {
    for (const [isVideo, isText] of [[true, false], [false, false], [false, true]]) {
      const form = new FormData();
      new UploadPost('test-key')._addFacebookParams(form, { facebookPageId: '1', facebookSponsorId: '123456' }, isVideo, isText);
      assert.equal(formFields(form).facebook_sponsor_id, '123456');
    }
  });

  test('Facebook accepts the API name and omits it when absent', () => {
    const named = new FormData();
    new UploadPost('test-key')._addFacebookParams(named, { facebook_sponsor_id: '77' }, true);
    assert.equal(formFields(named).facebook_sponsor_id, '77');

    const none = new FormData();
    new UploadPost('test-key')._addFacebookParams(none, { facebookPageId: '1' }, true);
    assert.equal('facebook_sponsor_id' in formFields(none), false);
  });

  test('Pinterest video and photo', () => {
    for (const isVideo of [true, false]) {
      const form = new FormData();
      new UploadPost('test-key')._addPinterestParams(form, { pinterestBoardId: 'b', pinterestSponsorId: '999' }, isVideo);
      assert.equal(formFields(form).pinterest_sponsor_id, '999');
    }
    const none = new FormData();
    new UploadPost('test-key')._addPinterestParams(none, { pinterestBoardId: 'b' }, true);
    assert.equal('pinterest_sponsor_id' in formFields(none), false);
  });

  test('end to end through uploadPhotos', async () => {
    const { client, calls } = capture();
    await client.uploadPhotos(['https://example.com/a.jpg'], {
      user: 'p', title: 'T', platforms: ['facebook', 'pinterest'],
      facebookPageId: '1', facebookSponsorId: '555', pinterestBoardId: 'b', pinterestSponsorId: '888',
    });
    assert.equal(calls[0].fields.facebook_sponsor_id, '555');
    assert.equal(calls[0].fields.pinterest_sponsor_id, '888');
  });
});

describe('editPost', () => {
  let sent;
  beforeEach(() => {
    sent = [];
    axios.defaults.adapter = async (config) => {
      sent.push(config);
      return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
    };
  });
  const body = () => JSON.parse(sent[sent.length - 1].data);

  test('declares the YouTube paid promotion', async () => {
    await new UploadPost('k').editPost({
      user: 'p', platform: 'youtube', postId: 'VID', hasPaidProductPlacement: true,
    });
    assert.equal(sent[0].method.toUpperCase(), 'POST');
    assert.match(sent[0].url, /\/uploadposts\/posts\/edit$/);
    assert.deepEqual(body(), { platform: 'youtube', user: 'p', post_id: 'VID', hasPaidProductPlacement: true });
  });

  test('false removes it (a value, not "not set")', async () => {
    await new UploadPost('k').editPost({
      user: 'p', platform: 'youtube', postId: 'VID', hasPaidProductPlacement: false,
    });
    assert.equal(body().hasPaidProductPlacement, false);
  });

  test('paidPartnership goes as the cross-network alias', async () => {
    await new UploadPost('k').editPost({ user: 'p', platform: 'youtube', postId: 'VID', paidPartnership: true });
    assert.deepEqual(body(), { platform: 'youtube', user: 'p', post_id: 'VID', paid_partnership: true });
  });

  test('other fields travel in `fields`, and the identifiers cannot be overridden by them', async () => {
    await new UploadPost('k').editPost({
      user: 'p', platform: 'facebook', postId: 'POST',
      fields: { message: 'Updated', platform: 'x', post_id: 'other' },
    });
    assert.deepEqual(body(), { message: 'Updated', platform: 'facebook', user: 'p', post_id: 'POST' });
  });
});
