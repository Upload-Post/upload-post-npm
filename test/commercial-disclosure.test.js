// Paid partnership / branded content fields (TT-988).
//
// No network: axios is given an adapter that records the request, and the form
// helpers are called directly.

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import FormData from 'form-data';
import { UploadPost } from '../index.js';

const client = () => new UploadPost('test-key');

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

const common = (options) => {
  const form = new FormData();
  client()._addCommonParams(form, { user: 'u', platforms: ['tiktok'], ...options });
  return formFields(form);
};

describe('paid_partnership', () => {
  test('paidPartnership goes as a lowercase boolean string', () => {
    assert.equal(common({ paidPartnership: true }).paid_partnership, 'true');
    assert.equal(common({ paidPartnership: false }).paid_partnership, 'false');
  });

  test('the snake_case name is accepted too', () => {
    assert.equal(common({ paid_partnership: true }).paid_partnership, 'true');
  });

  test('nothing is sent when it was not asked for', () => {
    assert.equal('paid_partnership' in common({}), false);
  });

  test('the YouTube field keeps working and is not turned into the alias', () => {
    const form = new FormData();
    client()._addYoutubeParams(form, { youtubeHasPaidProductPlacement: true });
    const fields = formFields(form);
    assert.equal(fields.hasPaidProductPlacement, 'true');
    assert.equal('paid_partnership' in fields, false);
  });
});

describe('sponsor ids', () => {
  test('facebookSponsorId rides along on Facebook video, photo and text posts', () => {
    for (const [isVideo, isText] of [[true, false], [false, false], [false, true]]) {
      const form = new FormData();
      client()._addFacebookParams(form, { facebookPageId: '1', facebookSponsorId: '9876543210' }, isVideo, isText);
      assert.equal(formFields(form).facebook_sponsor_id, '9876543210');
    }
  });

  test('a numeric sponsor id is sent as a string', () => {
    const form = new FormData();
    client()._addFacebookParams(form, { facebookSponsorId: 42 }, false);
    assert.equal(formFields(form).facebook_sponsor_id, '42');
  });

  test('pinterestSponsorId rides along on Pinterest video and photo pins', () => {
    for (const isVideo of [true, false]) {
      const form = new FormData();
      client()._addPinterestParams(form, { pinterestBoardId: 'b', pinterestSponsorId: '555' }, isVideo);
      assert.equal(formFields(form).pinterest_sponsor_id, '555');
    }
  });

  test('no sponsor id is sent unless one was given', () => {
    const fb = new FormData();
    client()._addFacebookParams(fb, { facebookPageId: '1' }, true);
    const pin = new FormData();
    client()._addPinterestParams(pin, { pinterestBoardId: 'b' }, true);
    assert.equal('facebook_sponsor_id' in formFields(fb), false);
    assert.equal('pinterest_sponsor_id' in formFields(pin), false);
  });

  test('upload only sends a sponsor id for a targeted network', async () => {
    const sent = [];
    axios.defaults.adapter = async (config) => {
      sent.push(config);
      return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
    };
    await client().upload('https://example.com/v.mp4', {
      user: 'u', title: 't', platforms: ['tiktok'],
      facebookSponsorId: '1', pinterestSponsorId: '2', paidPartnership: true,
    });
    const fields = formFields(sent[0].data);
    assert.equal(fields.paid_partnership, 'true');
    assert.equal('facebook_sponsor_id' in fields, false);
    assert.equal('pinterest_sponsor_id' in fields, false);
  });
});

describe('editPost', () => {
  let sent;

  beforeEach(() => {
    sent = [];
    axios.defaults.adapter = async (config) => {
      sent.push(config);
      return {
        data: { success: true, paidProductPlacementDetails: { hasPaidProductPlacement: true } },
        status: 200, statusText: 'OK', headers: {}, config,
      };
    };
  });

  const body = () => JSON.parse(sent[sent.length - 1].data);

  test('sets the YouTube paid-promotion declaration as a JSON boolean', async () => {
    const result = await client().editPost({
      user: 'u', platform: 'youtube', postId: 'vid1', hasPaidProductPlacement: true,
    });
    assert.equal(sent[0].method.toUpperCase(), 'POST');
    assert.match(sent[0].url, /\/uploadposts\/posts\/edit$/);
    assert.deepEqual(body(), {
      platform: 'youtube', user: 'u', post_id: 'vid1', hasPaidProductPlacement: true,
    });
    assert.equal(result.paidProductPlacementDetails.hasPaidProductPlacement, true);
  });

  test('false is kept, undefined and null are dropped', async () => {
    await client().editPost({
      user: 'u', platform: 'youtube', postId: 'vid1',
      hasPaidProductPlacement: false, title: null, description: undefined, privacyStatus: 'unlisted',
    });
    assert.deepEqual(body(), {
      platform: 'youtube', user: 'u', post_id: 'vid1',
      hasPaidProductPlacement: false, privacyStatus: 'unlisted',
    });
  });

  test('paidPartnership is the alias, youtubeHasPaidProductPlacement the YouTube name', async () => {
    await client().editPost({ user: 'u', platform: 'youtube', postId: 'v', paidPartnership: true });
    assert.equal(body().paid_partnership, true);
    await client().editPost({ user: 'u', platform: 'youtube', postId: 'v', youtubeHasPaidProductPlacement: true });
    assert.equal(body().hasPaidProductPlacement, true);
  });

  test('other platforms use the same endpoint', async () => {
    await client().editPost({ user: 'u', platform: 'facebook', postId: 'p1', message: 'new', isPinned: true });
    assert.deepEqual(body(), {
      platform: 'facebook', user: 'u', post_id: 'p1', message: 'new', is_pinned: true,
    });
  });
});
